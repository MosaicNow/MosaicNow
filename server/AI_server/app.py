from app_utils.sio_manager import sio
import socketio
from eventlet import wsgi
from controllers.process_controller import register_face, video_frame, start_streaming, stop_streaming


# WSGI 애플리케이션 생성
app = socketio.WSGIApp(sio)

if __name__ == '__main__':
    import eventlet
    eventlet.wsgi.server(eventlet.listen(('0.0.0.0', 5000)), app)