// import React, { useRef, useState, useEffect } from 'react';import './App.css';

// function ContentArea() {

//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [streamActive, setStreamActive] = useState(false);
//   const [frameCount, setFrameCount] = useState(0);
//   const [resultImageSrc, setResultImageSrc] = useState('');

//   const getUserMedia = () => {
//     navigator.mediaDevices.getUserMedia({ video: true })
//       .then(stream => {
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           setStreamActive(true);
//           setFrameCount(0);

//         }
//       })
//       .catch(error => console.error(error));
//   };

//   const captureFrameLoop = (callback) => {
//     if (!streamActive || frameCount > 50) {
//       stopCapture();
//       return;
//     }
//     const context = canvasRef.current.getContext('2d');
//     context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
//     canvasRef.current.toBlob(blob => {
//       callback(blob); // 캡처된 프레임을 처리하는 콜백 함수
//       setFrameCount(prevCount => prevCount + 1);
//     }, 'image/jpeg');
//     setTimeout(() => captureFrameLoop(callback), 100);
//   };

//   const stopCapture = () => {
//     if (streamActive && videoRef.current && videoRef.current.srcObject) {
//       const tracks = videoRef.current.srcObject.getTracks();
//       tracks.forEach(track => track.stop());
//       setStreamActive(false);
//       setFrameCount(0);
//       console.log("Streaming and capturing stopped.");
//     }
//   };

//   const sendFrame = (blob, endpoint) => {
//     const formData = new FormData();
//     formData.append('user_id', '1');
//     formData.append('frame', blob, 'frame.jpg');
//     fetch(`http://127.0.0.1:5000/${endpoint}`, {
//       method: 'POST',
//       body: formData
//     })
//     .then(response => response.blob())
//     .then(blob => {
//       setResultImageSrc(URL.createObjectURL(blob));
//     })
//     .catch(error => console.error('Error:', error));
//   };

//   const addFace = () => {
//     getUserMedia();
//     captureFrameLoop(blob => sendFrame(blob, 'add_face'));
//   };

//   const processFace = () => {
//     if (!streamActive) getUserMedia();
//     captureFrameLoop(blob => sendFrame(blob, 'process_face'));
//   };

//   // 기타 기능(set_streaming, start_streaming 등) 구현...

//   return (
//     <div>
//       <video ref={videoRef} autoPlay style={{ display: 'none' }} width="640" height="480"></video>
//       <canvas ref={canvasRef} style={{ display: 'none' }} width="640" height="480"></canvas>
//       {resultImageSrc && <img src={resultImageSrc} alt="Processed Image" />}
//       <button onClick={addFace}>Start Add</button>
//       <button onClick={processFace}>Start Process</button>
//       {/* setStreaming과 startStreaming에 대한 버튼 및 이벤트 핸들러 추가 */}
//     </div>
//   );
// }

// Other functions (processFace, setStreaming, startStreaming) are omitted for brevity

// 비디오만 되는 코드
import React, { useRef, useContext, useState, useEffect } from "react";
import ImageContext from "../ImageContext/ImageContext";
import "./App.css";

function ContentArea() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { resultImageUrl, setResultImageUrl } = useContext(ImageContext);
  const [streamActive, setStreamActive] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const getUserMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      } catch (err) {
        console.error("카메라에 연결할 수 없습니다:", err);
        setStreamActive(false);
      }
    };

    getUserMedia();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        setStreamActive(false);
      }
    };
  }, []);

  useEffect(() => {
    if (streamActive) {
      intervalRef.current = setInterval(captureAndSendFrame, 100);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [streamActive]);

  const captureAndSendFrame = () => {
    if (!canvasRef.current || !videoRef.current) {
      console.error("Canvas or video element is not ready.");
      return;
    }
    const context = canvasRef.current.getContext("2d");
    context.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    canvasRef.current.toBlob(sendFrameAdd, "image/jpeg");
  };

  const sendFrameAdd = (blob) => {
    let formData = new FormData();
    formData.append("user_id", 1);
    formData.append("selected_user_ids[]", 1);
    formData.append("frame", blob, "frame.jpg");

    fetch("http://127.0.0.1:5000/process_face", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.blob())
      .then((blob) => {
        const objectURL = URL.createObjectURL(blob);
        setResultImageUrl(objectURL);
      })
      .catch((error) => console.error("Error:", error));
  };

  return (
    <div className="ContentArea">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "640px", height: "480px", display: "none" }}
      />
      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
        width="640"
        height="480"
      ></canvas>
      {resultImageUrl && <img src={resultImageUrl} alt="Processed Image" />}
    </div>
  );
}

export default ContentArea;
