import os
import sys
import torch
from facenet_pytorch import InceptionResnetV1

# yolov5 디렉토리를 PYTHONPATH에 추가
script_dir = os.path.dirname(os.path.abspath(__file__))
yolov5_path = os.path.join(script_dir, 'yolov5')
model_path = os.path.join(script_dir, 'face_detection_yolov5s.pt')

# 모델 불러오기
model = torch.hub.load(yolov5_path, 'custom', path=model_path, source='local')
resnet = InceptionResnetV1(pretrained='vggface2').eval()