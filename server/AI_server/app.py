from app_utils.sio_manager import sio
import socketio
from eventlet import wsgi, listen, wrap_ssl
from controllers.process_controller import register_face, video_frame, start_streaming, stop_streaming
import ssl

# WSGI 애플리케이션 생성
app = socketio.WSGIApp(sio)

if __name__ == '__main__':
    import eventlet

    # SSL 인증서와 키 파일 경로 설정
    SSL_CERT_PATH = "/path/to/cert.pem"  # SSL 인증서 파일 경로
    SSL_KEY_PATH = "/path/to/privkey.pem"  # SSL 키 파일 경로

    # SSL 컨텍스트 생성
    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    ssl_context.load_cert_chain(certfile=SSL_CERT_PATH, keyfile=SSL_KEY_PATH)

    # SSL 적용된 소켓 생성
    ssl_socket = wrap_ssl(
        listen(('0.0.0.0', 5000)),  # 포트와 IP 주소
        certfile=SSL_CERT_PATH,
        keyfile=SSL_KEY_PATH,
        server_side=True
    )

    # WSGI 서버 실행
    eventlet.wsgi.server(ssl_socket, app)
