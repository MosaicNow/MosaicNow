import subprocess
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()
FFMPEG_PATH = os.getenv("FFMPEG_PATH")

ffmpeg_processes = {}

def start_ffmpeg_stream(user_id, stream_key):
    YOUTUBE_URL = 'rtmp://a.rtmp.youtube.com/live2'
    ffmpeg_command = [
        FFMPEG_PATH, '-f', 'mjpeg', '-i', '-', '-f', 'lavfi',
        '-i', 'anullsrc=r=44100:cl=stereo', '-acodec', 'aac', '-ar', '44100',
        '-ac', '2', '-strict', 'experimental', '-vcodec', 'libx264', '-g', '60',
        '-vb', '1500k', '-profile:v', 'baseline', '-preset', 'ultrafast', '-r', '30',
        '-f', 'flv', f"{YOUTUBE_URL}/{stream_key}"
    ]

    print(f"[DEBUG] Starting FFmpeg stream for user_id={user_id} with stream_key={stream_key}")
    print(f"[DEBUG] FFmpeg command: {' '.join(ffmpeg_command)}")

    try:
        # FFmpeg 실행 및 오류 출력 연결
        ffmpeg_processes[user_id] = subprocess.Popen(
            ffmpeg_command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print(f"[DEBUG] FFmpeg process started for user_id={user_id}")
    except FileNotFoundError:
        print("[ERROR] FFmpeg executable not found. Check FFMPEG_PATH environment variable.")
    except Exception as e:
        print(f"[ERROR] Failed to start FFmpeg process: {e}")

def stop_ffmpeg_stream(user_id):
    if user_id in ffmpeg_processes:
        try:
            ffmpeg_processes[user_id].stdin.close()
            ffmpeg_processes[user_id].terminate()
            del ffmpeg_processes[user_id]
            print(f"[DEBUG] FFmpeg stream stopped for user_id={user_id}")
        except Exception as e:
            print(f"[ERROR] Failed to stop FFmpeg stream for user_id={user_id}: {e}")
