import cv2
from app_utils.yolov5_utils import model, resnet
import numpy as np
import torch

def apply_mosaic(frame, top_left, bottom_right, factor=0.1):
    x1, y1 = top_left
    x2, y2 = bottom_right
    region = frame[y1:y2, x1:x2]
    mosaic = cv2.resize(region, (0, 0), fx=factor, fy=factor)
    mosaic = cv2.resize(mosaic, (x2-x1, y2-y1), interpolation=cv2.INTER_NEAREST)
    frame[y1:y2, x1:x2] = mosaic
    return frame

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