import numpy as np
from config import get_db_connection

user_data_cache = {}


def save_face_embedding_to_db(user_id, face_name, embedding):
    try:
        db = get_db_connection()
        cursor = db.cursor()
        embedding_blob = embedding.tobytes()
        query = "INSERT INTO embeddings (user_id, face_name, embedding) VALUES (%s, %s, %s)"
        cursor.execute(query, (user_id, face_name, embedding_blob))
        db.commit()
        print(f"Face {face_name} saved to database for user {user_id}.")
    except Exception as e:
        print(f"Error saving to database: {e}")


def load_user_embeddings(user_id, face_names):
    db = get_db_connection()
    cursor = db.cursor()
    placeholders = ', '.join(['%s'] * len(face_names))
    query = f"SELECT face_name, embedding FROM embeddings WHERE user_id = %s AND face_name IN ({placeholders})"
    cursor.execute(query, [user_id] + face_names)
    results = cursor.fetchall()

    embeddings = {row[0]: np.frombuffer(row[1], dtype=np.float32) for row in results}
    return [embeddings[face_name] for face_name in face_names if face_name in embeddings]


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

def fetch_faces(user_id):
    try:
        db = get_db_connection()
        cursor = db.cursor()

        # user_id에 해당하는 face_name 목록 조회
        query = "SELECT face_name FROM embeddings WHERE user_id = %s"
        cursor.execute(query, (user_id,))
        results = cursor.fetchall()

        # face_name 목록 반환
        face_list = [row[0] for row in results]
        return face_list
    except Exception as e:
        print(f"Error in fetch_faces: {e}")
        return []


