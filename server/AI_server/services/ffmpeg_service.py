import subprocess
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()
FFMPEG_PATH = os.getenv("FFMPEG_PATH")

ffmpeg_processes = {}


def start_ffmpeg_stream(user_id, stream_key):
    FFmpeg = r'C:\Users\ffmpeg-7.1-essentials_build\bin\ffmpeg.exe'
    YOUTUBE_URL = 'rtmp://a.rtmp.youtube.com/live2'
    ffmpeg_command = [
        FFMPEG_PATH, '-f', 'mjpeg', '-i', '-', '-f', 'lavfi',
        '-i', 'anullsrc=r=44100:cl=stereo', '-acodec', 'aac', '-ar', '44100',
        '-ac', '2', '-strict', 'experimental', '-vcodec', 'libx264', '-g', '60',
        '-vb', '1500k', '-profile:v', 'baseline', '-preset', 'ultrafast', '-r', '30',
        '-f', 'flv', f"{YOUTUBE_URL}/{stream_key}"
    ]

    ffmpeg_processes[user_id] = subprocess.Popen(ffmpeg_command, stdin=subprocess.PIPE)

def stop_ffmpeg_stream(user_id):
    if user_id in ffmpeg_processes:
        ffmpeg_processes[user_id].stdin.close()
        ffmpeg_processes[user_id].terminate()
        del ffmpeg_processes[user_id]