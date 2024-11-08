import os
import mysql.connector
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()


DATABASE_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "port": os.getenv("DB_PORT")
}

def get_db_connection():
    return mysql.connector.connect(**DATABASE_CONFIG)