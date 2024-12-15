import base64
import cv2
import numpy as np
import torch 
from services.embedding_service import save_face_embedding_to_db, get_user_embeddings, fetch_faces, delete_face_from_db
from services.mosaic_service import detect_faces_and_apply_mosaic
from services.ffmpeg_service import start_ffmpeg_stream, stop_ffmpeg_stream, ffmpeg_processes
from app_utils.yolov5_utils import model, resnet
from app_utils.sio_manager import sio



# 얼굴 등록 이벤트 핸들러
@sio.event
def register_face(sid, data):
    try:
        user_id = data['user_id']
        face_name = data['face_name']
        image_data = base64.b64decode(data['image'])

        print(f"Received register_face request: user_id={user_id}, face_name={face_name}")

        # 디코딩된 이미지를 저장하고 확인
        frame = cv2.imdecode(np.frombuffer(image_data, np.uint8), cv2.IMREAD_COLOR)
        if frame is None:
            print("Error decoding image.")
            sio.emit('register_result', {'status': 'fail', 'message': 'Invalid image data.'}, room=sid)
            return
        cv2.imwrite("debug_received_image.jpg", frame)
        print("Saved received image as 'debug_received_image.jpg'")

        # YOLOv5 얼굴 탐지
        results = model(frame)
        print(f"YOLOv5 Detection Results: {results.xyxy[0]}")

        if len(results.xyxy[0]) == 0:
            print("No faces detected by YOLOv5.")
            sio.emit('register_result', {'status': 'fail', 'message': 'No face detected.'}, room=sid)
            return

        embeddings = []
        for *xyxy, conf, cls in results.xyxy[0]:
            x1, y1, x2, y2 = map(int, xyxy)
            face = frame[y1:y2, x1:x2]
            face = cv2.resize(face, (160, 160))
            face_tensor = torch.tensor(face.transpose((2, 0, 1))).float().div(255).unsqueeze(0)
            print(f"Face tensor shape: {face_tensor.shape}")

            embedding = resnet(face_tensor).detach().numpy()
            embeddings.append(embedding)

        if embeddings:
            for embedding in embeddings:
                save_face_embedding_to_db(user_id, face_name, embedding)
            print(f"Successfully registered face: {face_name}")
            sio.emit('register_result', {'status': 'success', 'message': f'Face "{face_name}" registered successfully.'}, room=sid)
        else:
            print(f"No embeddings created for user_id={user_id}, face_name={face_name}")
            sio.emit('register_result', {'status': 'fail', 'message': 'Embedding creation failed.'}, room=sid)
    except Exception as e:
        print(f"Error in register_face: {e}")
        sio.emit('register_result', {'status': 'error', 'message': 'Internal server error.'}, room=sid)

# 실시간 스트리밍 처리
@sio.event
def video_frame(sid, data):
    user_id = data.get('user_id')
    face_names = data.get('face_names', [])
    image_data = data.get('image')

    if not user_id or not image_data:
        print("[ERROR] Missing user_id or image in video_frame")
        return

    print(f"[DEBUG] Received video_frame for user_id={user_id}, face_names={face_names}")

    try:
        image_data_decoded = base64.b64decode(image_data)
        embeddings = get_user_embeddings(user_id, face_names)
        processed_frame = detect_faces_and_apply_mosaic(image_data_decoded, embeddings)

        success, encoded_frame = cv2.imencode('.jpg', processed_frame)
        if not success:
            print("[ERROR] Failed to encode frame as JPEG")
            return

        frame_bytes = encoded_frame.tobytes()
        sio.emit('processed_frame', {'image': base64.b64encode(encoded_frame).decode('utf-8')}, room=sid)

        if user_id in ffmpeg_processes:
            try:
                for _ in range(3):
                    ffmpeg_processes[user_id].stdin.write(frame_bytes)
                    ffmpeg_processes[user_id].stdin.flush()
                print("[DEBUG] Frame written to FFmpeg process")
            except Exception as e:
                print(f"[ERROR] Failed to write frame to FFmpeg for user_id={user_id}: {e}")
    except Exception as e:
        print(f"[ERROR] Exception in video_frame: {e}")


@sio.event
def fetch_faces_request(sid, data):
    try:
        user_id = data['user_id']
        print(f"Fetching faces for user_id={user_id}")

        # fetch_faces 함수로 얼굴 목록 가져오기
        face_list = fetch_faces(user_id)

        # 클라이언트로 결과 전송
        sio.emit('fetch_faces_result', {'faces': [{'face_name': name} for name in face_list]}, room=sid)
    except Exception as e:
        print(f"Error in fetch_faces_request: {e}")
        sio.emit('fetch_faces_result', {'faces': []}, room=sid)



# 스트리밍 시작 이벤트
@sio.event
def start_streaming(sid, data):
    user_id = data.get('user_id')
    stream_key = data.get('streamKey')
    
    print(f"[DEBUG] Received start_streaming request: user_id={user_id}, stream_key={stream_key}")

    if not user_id or not stream_key:
        print("[ERROR] Missing user_id or stream_key in start_streaming")
        sio.emit('streaming_error', {'message': 'Missing user_id or stream_key'}, room=sid)
        return

    try:
        start_ffmpeg_stream(user_id, stream_key)
        sio.emit('streaming_started', {'status': 'success', 'message': 'Streaming has started!'}, room=sid)
        print("[DEBUG] Streaming process started successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to start streaming process: {e}")
        sio.emit('streaming_error', {'message': 'Failed to start streaming process'}, room=sid)

# 얼굴 삭제 이벤트 핸들러
@sio.event
def delete_face(sid, data):
    try:
        user_id = data['user_id']
        face_name = data['face_name']

        print(f"Deleting face: {face_name} for user: {user_id}")

        if delete_face_from_db(user_id, face_name):
            print(f"Face {face_name} deleted successfully for user {user_id}.")
            sio.emit('delete_face_result', {'success': True, 'message': f'Face "{face_name}" deleted successfully.'}, room=sid)
        else:
            print(f"Failed to delete face: {face_name} for user: {user_id}")
            sio.emit('delete_face_result', {'success': False, 'message': 'Failed to delete face.'}, room=sid)
    except Exception as e:
        print(f"Error in delete_face: {e}")
        sio.emit('delete_face_result', {'success': False, 'message': 'Internal server error.'}, room=sid)



# 스트리밍 중지 이벤트
@sio.event
def stop_streaming(sid, data):
    user_id = data['user_id']
    stop_ffmpeg_stream(user_id)
    sio.emit('streaming_stopped', {'status': 'success', 'message': 'Streaming has stopped.'}, room=sid)