import base64
from services.embedding_service import save_face_embedding_to_db, get_user_embeddings
from services.mosaic_service import detect_faces_and_apply_mosaic
from services.ffmpeg_service import start_ffmpeg_stream, stop_ffmpeg_stream, send_audio_to_ffmpeg, start_ffmpeg_audio_stream, ffmpeg_processes
from app_utils.yolov5_utils import model, resnet
import cv2
import numpy as np
from app_utils.sio_manager import sio
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaStreamTrack


# 얼굴 등록 이벤트 핸들러
@sio.event
def register_face(sid, data):
    user_id = data['user_id']
    face_name = data['face_name']
    image_data = base64.b64decode(data['image'])

    frame = cv2.imdecode(np.frombuffer(image_data, np.uint8), cv2.IMREAD_COLOR)
    results = model(frame)

    embeddings = []
    for *xyxy, conf, cls in results.xyxy[0]:
        x1, y1, x2, y2 = map(int, xyxy)
        face = frame[y1:y2, x1:x2]
        face = cv2.resize(face, (160, 160))
        face = torch.tensor(face.transpose((2, 0, 1))).float().div(255).unsqueeze(0)
        embedding = resnet(face).detach().numpy()
        embeddings.append(embedding)

    if embeddings:
        for embedding in embeddings:
            save_face_embedding_to_db(user_id, face_name, embedding)
        sio.emit('register_result', {'status': 'success', 'message': f'Face "{face_name}" registered successfully.'}, room=sid)
    else:
        sio.emit('register_result', {'status': 'fail', 'message': 'No face detected.'}, room=sid)


# 실시간 스트리밍 처리
@sio.event
def video_frame(sid, data):
    user_id = data['user_id']
    face_names = data['face_names']
    image_data = base64.b64decode(data['image'])

    embeddings = get_user_embeddings(user_id, face_names) 
    processed_frame = detect_faces_and_apply_mosaic(image_data, embeddings)

    success, encoded_frame = cv2.imencode('.jpg', processed_frame)
    if not success:
        print("Error: Failed to encode frame as JPEG")
        return

    frame_bytes = encoded_frame.tobytes()
    sio.emit('processed_frame', {'image': base64.b64encode(encoded_frame).decode('utf-8')}, room=sid)

    if user_id in ffmpeg_processes:
        try:
            for _ in range(3):
                ffmpeg_processes[user_id].stdin.write(frame_bytes)
                ffmpeg_processes[user_id].stdin.flush()
        except Exception as e:
            print(f"Error writing to FFmpeg for user {user_id}: {e}")


# 스트리밍 시작 이벤트
@sio.event
def start_streaming(sid, data):
    user_id = data['user_id']
    stream_key = data['streamKey']
    start_ffmpeg_stream(user_id, stream_key)
    sio.emit('streaming_started', {'status': 'success', 'message': 'Streaming has started!'}, room=sid)


# 스트리밍 중지 이벤트
@sio.event
def stop_streaming(sid, data):
    user_id = data['user_id']
    stop_ffmpeg_stream(user_id)
    sio.emit('streaming_stopped', {'status': 'success', 'message': 'Streaming has stopped.'}, room=sid)


# WebRTC Offer 처리 (오디오)
@sio.event
async def webrtc_offer(sid, data):
    pc = RTCPeerConnection()
    sdp = data.get("sdp")
    user_id = data.get("user_id")
    stream_key = data.get("stream_key")
    
    await pc.setRemoteDescription(RTCSessionDescription(sdp, "offer"))

    # Answer 생성
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    sio.emit("webrtc_answer", {"sdp": pc.localDescription.sdp, "type": "answer"}, room=sid)

    # FFmpeg 오디오 스트림 시작
    start_ffmpeg_audio_stream(user_id, stream_key)

    # 오디오 트랙 수신 처리
    @pc.on("track")
    async def on_track(track):
        print("Received track:", track.kind)  # 트랙 종류 로그
        if track.kind == "audio":
            while True:
                frame = await track.recv()
                print("Received audio frame:", frame)  # 오디오 프레임 로그
                send_audio_to_ffmpeg(user_id, frame.to_ndarray())  # 서비스 함수로 프레임 전송


