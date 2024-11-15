import subprocess
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()
FFMPEG_PATH = os.getenv("FFMPEG_PATH")

ffmpeg_processes = {}


def start_ffmpeg_stream(user_id, stream_key):
    YOUTUBE_URL = 'rtmp://a.rtmp.youtube.com/live2'

    # FFmpeg 명령어
    ffmpeg_command = [
        FFMPEG_PATH,
        "-f", "mjpeg", "-i", "-",                 # 비디오 입력
        "-f", "s16le", "-ar", "48000", "-ac", "2", "-i", "pipe:0",  # 오디오 입력
        "-vcodec", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast", "-g", "50",
        "-b:v", "3000k", "-maxrate", "3000k", "-bufsize", "6000k",
        "-acodec", "aac", "-ar", "44100", "-b:a", "128k", "-ac", "2",
        "-f", "flv", f"{YOUTUBE_URL}/{stream_key}"
    ]

    # FFmpeg 프로세스 생성
    ffmpeg_process = subprocess.Popen(
        ffmpeg_command,
        stdin=subprocess.PIPE
    )

    ffmpeg_processes[user_id] = {
        "video": ffmpeg_process,
        "audio": ffmpeg_process
    }


def stop_ffmpeg_stream(user_id):
    if user_id in ffmpeg_processes:
        for process_type in ffmpeg_processes[user_id]:
            process = ffmpeg_processes[user_id][process_type]
            process.stdin.close()
            process.terminate()

        del ffmpeg_processes[user_id]