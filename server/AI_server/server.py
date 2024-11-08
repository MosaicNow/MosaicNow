import socketio
import torch
import numpy as np
import cv2
import base64
import os
from eventlet import wsgi
from facenet_pytorch import InceptionResnetV1
import mysql.connector
import subprocess

# 비동기 Socket.IO 서버 생성 (CORS 설정 포함)
sio = socketio.Server(cors_allowed_origins="http://localhost:3000")

# 모델 및 MySQL 설정
script_dir = os.path.dirname(os.path.abspath(__file__))
yolov5_path = os.path.join(script_dir, 'yolov5')
model_path = os.path.join(script_dir, 'face_detection_yolov5s.pt')
model = torch.hub.load(yolov5_path, 'custom', path=model_path, source='local')
resnet = InceptionResnetV1(pretrained='vggface2').eval()


'''
CREATE TABLE embeddings (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT,
    face_name VARCHAR(255),
    embedding BLOB,
    PRIMARY KEY (id)
);
'''


db = mysql.connector.connect(
    host="127.0.0.1",
    user="root",

    database="mosaicnow_db",
    port="3306"
)

# 사용자별 FFmpeg 프로세스 관리 딕셔너리
ffmpeg_processes = {}

# 사용자 임베딩 캐시
user_data_cache = {}

# 사용자 임베딩을 데이터베이스에 저장
def save_face_embedding_to_db(user_id, face_name, embedding):
    cursor = db.cursor()
    embedding_blob = embedding.tobytes()
    query = "INSERT INTO embeddings (user_id, face_name, embedding) VALUES (%s, %s, %s)"
    cursor.execute(query, (user_id, face_name, embedding_blob))
    db.commit()

# 얼굴 등록 이벤트 핸들러
@sio.event
def register_face(sid, data):
    user_id = data['user_id']
    face_name = data['face_name']
    image_data = base64.b64decode(data['image'])

    # 이미지 디코딩 후 얼굴 임베딩 생성
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


# 데이터베이스에서 여러 사용자 임베딩을 불러오는 함수
def load_user_embeddings(user_id, face_names):
    cursor = db.cursor()
    placeholders = ', '.join(['%s'] * len(face_names))
    query = f"SELECT face_name, embedding FROM embeddings WHERE user_id = %s AND face_name IN ({placeholders})"
    cursor.execute(query, [user_id] + face_names)
    results = cursor.fetchall()

    embeddings = {row[0]: np.frombuffer(row[1], dtype=np.float32) for row in results}
    return [embeddings[face_name] for face_name in face_names if face_name in embeddings]

# 캐시에서 사용자 임베딩을 불러오는 함수
def get_user_embeddings(user_id, face_names):
    embeddings = []
    missing_face_names = []

    for face_name in face_names:
        key = f"{user_id}_{face_name}"
        if key in user_data_cache:
            embeddings.append(user_data_cache[key]["embedding"])
        else:
            missing_face_names.append(face_name)

    if missing_face_names:
        db_embeddings = load_user_embeddings(user_id, missing_face_names)
        for face_name, embedding in zip(missing_face_names, db_embeddings):
            key = f"{user_id}_{face_name}"
            user_data_cache[key] = {"embedding": embedding}
            embeddings.append(embedding)
    
    return embeddings

# 모자이크 처리 함수
def apply_mosaic(frame, top_left, bottom_right, factor=0.1):
    x1, y1 = top_left
    x2, y2 = bottom_right
    region = frame[y1:y2, x1:x2]
    mosaic = cv2.resize(region, (0, 0), fx=factor, fy=factor)
    mosaic = cv2.resize(mosaic, (x2-x1, y2-y1), interpolation=cv2.INTER_NEAREST)
    frame[y1:y2, x1:x2] = mosaic
    return frame

# YOLOv5를 사용한 얼굴 검출 및 모자이크 적용
def detect_faces_and_apply_mosaic(image, embeddings):
    frame = cv2.imdecode(np.frombuffer(image, np.uint8), cv2.IMREAD_COLOR)
    results = model(frame)
    
    for *xyxy, conf, cls in results.xyxy[0]:
        x1, y1, x2, y2 = map(int, xyxy)
        face = frame[y1:y2, x1:x2]
        face = cv2.resize(face, (160, 160))
        face = torch.tensor(face.transpose((2, 0, 1))).float().div(255).unsqueeze(0)
        face_embedding = resnet(face).detach().numpy()

        is_known_face = any(np.linalg.norm(face_embedding - emb) < 0.7 for emb in embeddings)
        if not is_known_face:
            frame = apply_mosaic(frame, (x1, y1), (x2, y2))

    return frame

# 스트리밍 시작 이벤트
@sio.event
def start_streaming(sid, data):
    user_id = data['user_id']
    stream_key = data['streamKey']

    FFmpeg = r'C:\Users\ffmpeg-7.1-essentials_build\bin\ffmpeg.exe'
    YOUTUBE_URL = 'rtmp://a.rtmp.youtube.com/live2'

    ffmpeg_command = [
    FFmpeg,
    '-f', 'mjpeg',             # 이 옵션을 추가하여 입력이 MJPEG 형식임을 명시
    '-i', '-',                 # 파이프 입력을 통해 이미지를 스트림으로 전송
    '-f', 'lavfi',
    '-i', 'anullsrc=r=44100:cl=stereo',
    '-acodec', 'aac',
    '-ar', '44100',
    '-ac', '2',
    '-strict', 'experimental',
    '-vcodec', 'libx264',
    '-g', '60',
    '-vb', '1500k',
    '-profile:v', 'baseline',
    '-preset', 'ultrafast',
    '-r', '30',
    '-f', 'flv',
    f"{YOUTUBE_URL}/{stream_key}"
]

    
    ffmpeg_processes[user_id] = subprocess.Popen(ffmpeg_command, stdin=subprocess.PIPE)
    sio.emit('streaming_started', {'status': 'success', 'message': 'Streaming has started!'}, room=sid)

# 스트리밍 중지 이벤트
@sio.event
def stop_streaming(sid, data):
    user_id = data['user_id']
    if user_id in ffmpeg_processes:
        ffmpeg_processes[user_id].stdin.close()
        ffmpeg_processes[user_id].terminate()
        del ffmpeg_processes[user_id]
        sio.emit('streaming_stopped', {'status': 'success', 'message': 'Streaming has stopped.'}, room=sid)

# 실시간 스트리밍 처리
@sio.event
def video_frame(sid, data):
    user_id = data['user_id']
    face_names = data['face_names']
    image_data = base64.b64decode(data['image'])

    # 얼굴 모자이크를 적용
    embeddings = get_user_embeddings(user_id, face_names) 
    processed_frame = detect_faces_and_apply_mosaic(image_data, embeddings)

    # 프레임을 JPEG로 인코딩
    success, encoded_frame = cv2.imencode('.jpg', processed_frame)
    if not success:
        print("Error: Failed to encode frame as JPEG")
        return

    frame_bytes = encoded_frame.tobytes()

    # 디버깅용: ffmpeg에 전송되는 프레임을 로컬에 저장
    #with open("debug_frame.jpg", "wb") as f:
    #    f.write(frame_bytes)
        

    # 클라이언트에 전송
    sio.emit('processed_frame', {'image': base64.b64encode(encoded_frame).decode('utf-8')}, room=sid)

    # FFmpeg 프로세스로 프레임 전송
    if user_id in ffmpeg_processes:
        try:
            for _ in range(3):  # 같은 프레임을 3번 전송
                ffmpeg_processes[user_id].stdin.write(frame_bytes)
                ffmpeg_processes[user_id].stdin.flush()  # flush를 통해 데이터 전송을 보장
        except Exception as e:
            print(f"Error writing to FFmpeg for user {user_id}: {e}")

# WSGI 애플리케이션 생성
app = socketio.WSGIApp(sio)

if __name__ == '__main__':
    import eventlet
    eventlet.wsgi.server(eventlet.listen(('0.0.0.0', 5000)), app)