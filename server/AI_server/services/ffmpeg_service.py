import subprocess
import os
from dotenv import load_dotenv
import numpy as np

# .env 파일 로드
load_dotenv()
FFMPEG_PATH = os.getenv("FFMPEG_PATH")
YOUTUBE_URL = 'rtmp://a.rtmp.youtube.com/live2'

ffmpeg_processes_video = {}
ffmpeg_processes_audio = {}

def start_ffmpeg_video_stream(user_id, stream_key):
    ffmpeg_command = [
        FFMPEG_PATH,
        '-f', 'mjpeg', '-i', '-',                # 비디오 입력을 stdin으로 설정
        '-acodec', 'aac', '-ar', '44100', '-ac', '2',  # 오디오 인코딩 설정
        '-vcodec', 'libx264', '-g', '60', '-vb', '1500k', 
        '-profile:v', 'baseline', '-preset', 'ultrafast', '-r', '30',
        '-f', 'flv', f"{YOUTUBE_URL}/{stream_key}"
    ]

    ffmpeg_processes_video[user_id] = subprocess.Popen(ffmpeg_command, stdin=subprocess.PIPE)


def start_ffmpeg_audio_stream(user_id, stream_key):
    print("start ffmpeg audio")
    ffmpeg_command = [
        FFMPEG_PATH,
        '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', 'pipe:0',  # 오디오 입력을 stdin으로 설정
        '-acodec', 'aac', '-ar', '44100', '-ac', '2',
        '-f', 'flv', f"{YOUTUBE_URL}/{stream_key}"
    ]

    ffmpeg_processes_audio[user_id] = subprocess.Popen(ffmpeg_command, stdin=subprocess.PIPE)


def send_audio_to_ffmpeg(user_id, audio_frame):
    print("send audio to ffmpeg")
    if user_id in ffmpeg_processes_audio:
        pcm_data = audio_frame.astype(np.int16).tobytes()  # PCM 형식으로 변환
        try:
            ffmpeg_processes_audio[user_id].stdin.write(pcm_data)
        except BrokenPipeError:
            print("FFmpeg pipe broken for user:", user_id)
            stop_ffmpeg_streams(user_id)


def stop_ffmpeg_streams(user_id):
    """Stop both video and audio FFmpeg streams for the specified user."""
    if user_id in ffmpeg_processes_video:
        ffmpeg_processes_video[user_id].stdin.close()
        ffmpeg_processes_video[user_id].terminate()
        del ffmpeg_processes_video[user_id]

    if user_id in ffmpeg_processes_audio:
        ffmpeg_processes_audio[user_id].stdin.close()
        ffmpeg_processes_audio[user_id].terminate()
        del ffmpeg_processes_audio[user_id]