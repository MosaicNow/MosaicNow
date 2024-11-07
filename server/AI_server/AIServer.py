from flask import Flask, request, redirect, jsonify, send_file, render_template
from flask_cors import CORS
import cv2
from facenet_pytorch import InceptionResnetV1
import torch
import numpy as np
import os
import tempfile
import subprocess
import ssl



app = Flask(__name__)
cors = CORS(app)

# 모델 로드
script_dir = os.path.dirname(os.path.abspath(__file__))
yolov5_path = os.path.join(script_dir, 'yolov5')
model_path = os.path.join(script_dir, 'face_detection_yolov5s.pt')
model = torch.hub.load(yolov5_path, 'custom', path=os.path.join(script_dir, model_path), source='local')
resnet = InceptionResnetV1(pretrained='vggface2').eval()

# 디렉토리 생성 함수
def create_directory(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

# InceptionResnetV1 얼굴 임베딩 모델 초기화
resnet = InceptionResnetV1(pretrained='vggface2').eval()

# 데이터셋 저장 경로
dataset_path = os.path.join(script_dir, 'dataset')
create_directory(dataset_path)


def load_selected_embeddings(selected_user_ids):
    embeddings = []
    labels = []
    for user_id in selected_user_ids:
        user_folder = os.path.join(dataset_path, f"user_{user_id}")  # 사용자 ID별 폴더 경로
        if not os.path.exists(user_folder):
            print(f"No data for user ID {user_id}")
            continue  # 해당 사용자 폴더가 없으면 다음 사용자로 넘어감
        for file in os.listdir(user_folder):
            if file.endswith(".npy"):  # npy 파일만 로드
                embedding = np.load(os.path.join(user_folder, file))
                embeddings.append(embedding)
                labels.append(int(user_id))
    return np.array(embeddings), np.array(labels)

def apply_mosaic(frame, top_left, bottom_right, factor=0.1):
    x1, y1 = top_left
    x2, y2 = bottom_right
    region = frame[y1:y2, x1:x2]
    mosaic = cv2.resize(region, (0,0), fx=factor, fy=factor)
    mosaic = cv2.resize(mosaic, (x2-x1, y2-y1), interpolation=cv2.INTER_NEAREST)
    frame[y1:y2, x1:x2] = mosaic
    return frame





@app.route('/')
def home():
    return render_template('index.html')





# 사용자별 임베딩을 저장할 임시 딕셔너리
user_embeddings = {}

@app.route('/add_face', methods=['POST'])
def add_face():
    # 사용자 ID 확인
    user_id = request.form['user_id']
    if not user_id:
        return jsonify({'error': 'User ID is required.'}), 400

    # 이미지 파일 받기
    file = request.files['frame']
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    file.save(temp.name)
    temp.close() 

    # 이미지 프레임 처리
    frame = cv2.imread(temp.name)
    #gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # YOLOv5를 사용한 얼굴 감지
    results = model(frame)
    embeddings = []
    for *xyxy, conf, cls in results.xyxy[0]:
        # 얼굴 임베딩 생성
        x1, y1, x2, y2 = map(int, xyxy)
        face = frame[y1:y2, x1:x2]
        face = cv2.resize(face, (160, 160))
        face = torch.tensor(face.transpose((2, 0, 1))).float().div(255)
        face = face.unsqueeze(0)
        embedding = resnet(face)
        embeddings.append(embedding.detach().numpy())

        # 얼굴에 박스 그리기
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)


    # user_id가 user_embeddings 딕셔너리에 없는 경우 초기 리스트 할당
    if user_id not in user_embeddings:
        user_embeddings[user_id] = []

    # 사용자별 임베딩 저장
    if embeddings:
        embeddings_np = np.array(embeddings).mean(axis=0)  
        if user_id not in user_embeddings:
            user_embeddings[user_id] = [embeddings_np]
        else:
            user_embeddings[user_id].append(embeddings_np)


    if len(user_embeddings[user_id]) == 50:
        avg_embedding = np.mean(np.stack(user_embeddings[user_id]), axis=0)
        user_folder = os.path.join(dataset_path, f"user_{user_id}")
        create_directory(user_folder)
        
        files = [f for f in os.listdir(user_folder) if f.endswith('.npy')]
        next_file_number = len(files) + 1
        filename = os.path.join(user_folder, f"{next_file_number}.npy")
        
        np.save(filename, avg_embedding)
        user_embeddings[user_id] = []  # 사용자의 임베딩 리스트 초기화
        


    # 처리된 이미지를 임시 파일로 저장
    _, processed_img_path = tempfile.mkstemp(suffix='.jpg')
    cv2.imwrite(processed_img_path, frame)

    # 처리된 이미지 파일을 클라이언트에게 반환
    response = send_file(processed_img_path, mimetype='image/jpeg')

    # 임시 파일 삭제
    try:
        os.unlink(temp.name)
    except PermissionError as e:
        print(f"Error deleting file {temp.name}: {e}")

    return response







@app.route('/process_face', methods=['POST'])
def process_face():
    # 사용자 ID 확인
    user_id = request.form['user_id']
    selected_user_ids = request.form.getlist('selected_user_ids[]') 

    if not user_id:
        return jsonify({'error': 'User ID is required.'}), 400


    # 입력받은 사용자 ID에 해당하는 임베딩 로드
    embeddings, labels = load_selected_embeddings(selected_user_ids)
    embeddings = np.squeeze(embeddings, axis=1) 

    if len(embeddings) == 0:
        return jsonify({'error': 'No embeddings found for the selected user IDs.'}), 404

    # 이미지 파일 받기
    file = request.files['frame']
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    file.save(temp.name)
    temp.close() 

    # 이미지 프레임 처리
    frame = cv2.imread(temp.name)
    results = model(frame)
    for *xyxy, conf, cls in results.xyxy[0]:
        x1, y1, x2, y2 = map(int, xyxy)
        face = frame[y1:y2, x1:x2]
        face = cv2.resize(face, (160, 160))
        face = torch.tensor(face.transpose((2, 0, 1))).float().div(255)
        face = face.unsqueeze(0)
        current_embedding = resnet(face).detach().numpy()

        distances = np.linalg.norm(embeddings - current_embedding, axis=1)
        min_distance = np.min(distances)
        min_distance_index = np.argmin(distances)
        label = labels[min_distance_index]

        if min_distance < 0.7:
            name = f"User {label}"
        else:
            name = "Unknown"
            frame = apply_mosaic(frame, (x1, y1), (x2, y2))

        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(frame, name, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        

    # 처리된 이미지를 임시 파일로 저장
    _, processed_img_path = tempfile.mkstemp(suffix='.jpg')
    cv2.imwrite(processed_img_path, frame)

    # 처리된 이미지 파일을 클라이언트에게 반환
    response = send_file(processed_img_path, mimetype='image/jpeg')

    # 임시 파일 삭제
    try:
        os.unlink(temp.name)
    except PermissionError as e:
        print(f"Error deleting file {temp.name}: {e}")

    return response










# 사용자별 스트리밍 정보 저장할 임시 딕셔너리
user_pipe= {}

@app.route('/set_streaming', methods=['POST'])
def set_streaming():
    # 사용자 ID 확인
    user_id = request.form['user_id']
    stream_key = request.form['stream_key'] 

    if not user_id:
        return jsonify({'error': 'User ID is required.'}), 400

    # 스트리밍 세팅  C:\Users\ffmpeg-2024-01-17-git-8e23ebe6f9-full_build\bin\ffmpeg.exe
    FFmpeg = r'D:\다운로드\ffmpeg-6.1.1-full_build\ffmpeg-6.1.1-full_build\bin\ffmpeg.exe'
    YOUTUBE_URL = 'rtmp://a.rtmp.youtube.com/live2'
    command = [
                FFmpeg,
                '-f', 'image2pipe',
                '-vcodec', 'mjpeg',
                '-s', '640x480',
                '-i', '-',
                '-f', 'lavfi',
                '-i', 'anullsrc=r=44100:cl=stereo',  # Dummy audio generation   -> audio=마이크(HCAM01Q)
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
    

    try:
        user_pipe[user_id] = subprocess.Popen(command, stdin=subprocess.PIPE)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'message': 'stream setting fail due to an error', 'status': 'fail'})


    return jsonify({'message': 'stream setting success', 'status': 'success'})


@app.route('/stop_streaming', methods=['POST'])
def stop_streaming():

    print("stop")
    # 사용자 ID 확인
    user_id = request.form['user_id']

    if not user_id or not user_pipe[user_id]:
        return jsonify({'error': 'User ID is required.'}), 400
    

    try:
        user_pipe[user_id].terminate()  # 프로세스에 종료 신호 보내기
        user_pipe[user_id].wait(timeout=10)  # 종료될 때까지 최대 10초간 기다림
        user_pipe[user_id].stdin.close()  # 필요하다면, stdin 스트림 닫기
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'message': 'stream stop fail due to an error', 'status': 'fail'})
    finally:
        # 프로세스 참조 제거
        del user_pipe[user_id]

    return jsonify({'message': 'stream stop success', 'status': 'success'})



@app.route('/start_streaming', methods=['POST'])
def start_streaming():
    # 사용자 ID 확인
    user_id = request.form['user_id']
    selected_user_ids = request.form.getlist('selected_user_ids[]') 

    if not user_id:
        return jsonify({'error': 'User ID is required.'}), 400 
    elif user_id not in user_pipe:
        # set_streaming을 통해 스트리밍이 설정되지 않았을 경우
        return jsonify({'error': 'Streaming not set for this user ID.'}), 400


    # 입력받은 사용자 ID에 해당하는 임베딩 로드
    embeddings, labels = load_selected_embeddings(selected_user_ids)
    embeddings = np.squeeze(embeddings, axis=1) 
    if len(embeddings) == 0:
        return jsonify({'error': 'No embeddings found for the selected user IDs.'}), 404


    
    # 이미지 파일 받기
    file = request.files['frame']
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    file.save(temp.name)
    temp.close() 
    # 이미지 프레임 처리
    frame = cv2.imread(temp.name)
    results = model(frame)
    for *xyxy, conf, cls in results.xyxy[0]:
        x1, y1, x2, y2 = map(int, xyxy)
        face = frame[y1:y2, x1:x2]
        face = cv2.resize(face, (160, 160))
        face = torch.tensor(face.transpose((2, 0, 1))).float().div(255)
        face = face.unsqueeze(0)
        current_embedding = resnet(face).detach().numpy()

        distances = np.linalg.norm(embeddings - current_embedding, axis=1)
        min_distance = np.min(distances)
        min_distance_index = np.argmin(distances)
        label = labels[min_distance_index]

        if min_distance < 0.7:
            name = f"User {label}"
        else:
            name = "Unknown"
            frame = apply_mosaic(frame, (x1, y1), (x2, y2))

        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(frame, name, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        
    # Encode the frame as JPEG
    _, jpg_data = cv2.imencode('.jpg', frame)
    
    
    # Write the JPEG data to the pipe
    user_pipe[user_id].stdin.write(jpg_data.tobytes())
    user_pipe[user_id].stdin.write(jpg_data.tobytes())
    user_pipe[user_id].stdin.write(jpg_data.tobytes())


    # 처리된 이미지를 임시 파일로 저장
    _, processed_img_path = tempfile.mkstemp(suffix='.jpg')
    cv2.imwrite(processed_img_path, frame)

    # 처리된 이미지 파일을 클라이언트에게 반환
    response = send_file(processed_img_path, mimetype='image/jpeg')

    # 임시 파일 삭제
    try:
        os.unlink(temp.name)
    except PermissionError as e:
        print(f"Error deleting file {temp.name}: {e}")

    return response





#if __name__ == '__main__':
#    app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == '__main__':
    app.run(port=5000, host='0.0.0.0')

#if __name__ == "__main__":
#    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS)
#    ssl_context.load_cert_chain(certfile='newcert.pem', keyfile='newkey.pem', password='secret')
#    app.run(host="0.0.0.0", port=5000, ssl_context=ssl_context)