import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

function App() {
  const [userId] = useState("1"); // userId를 1로 하드코딩
  const [faceOptions, setFaceOptions] = useState(["hj", "yr", "sc"]); // 데베에서 불러올 예정
  const [selectedFaceNames, setSelectedFaceNames] = useState([]); // 선택된 얼굴 이름 리스트
  const [faceNameToRegister, setFaceNameToRegister] = useState(""); // 새로 등록할 얼굴 이름
  const [streamKey, setStreamKey] = useState("");
  const [processedImage, setProcessedImage] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const previewIntervalRef = useRef(null);

  useEffect(() => {
    socket.on("register_result", (data) => {
      alert(data.message);
    });

    socket.on("processed_frame", (data) => {
      setProcessedImage(`data:image/jpeg;base64,${data.image}`);
    });

    return () => {
      socket.off("register_result");
      socket.off("processed_frame");
      clearInterval(previewIntervalRef.current);
    };
  }, []);

  // 얼굴 선택 체크박스 변경 시 호출되는 함수
  const handleFaceNameChange = (faceName) => {
    setSelectedFaceNames((prevSelected) =>
      prevSelected.includes(faceName)
        ? prevSelected.filter((name) => name !== faceName) // 이미 선택된 경우 제거
        : [...prevSelected, faceName] // 선택된 경우 추가
    );
  };

  // selectedFaceNames 변경 시 프리뷰가 재시작되도록 설정
  useEffect(() => {
    if (isPreviewing) {
      stopPreview();
      startPreview();
    }
  }, [selectedFaceNames]);

  // 웹캠에서 이미지를 캡처하여 서버에 전송 (얼굴 등록용)
  const captureImage = () => {
    if (!faceNameToRegister) {
      alert("Please enter a face name to register.");
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg").split(",")[1];
    socket.emit("register_face", { user_id: userId, face_name: faceNameToRegister, image });
    setFaceNameToRegister(""); // 얼굴 이름 입력 필드 초기화
  };

  const startPreview = () => {
    setIsPreviewing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    previewIntervalRef.current = setInterval(() => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = canvas.toDataURL("image/jpeg").split(",")[1];
      socket.emit("video_frame", { user_id: userId, face_names: [...selectedFaceNames], image: frame });
    }, 100);
  };

  const stopPreview = () => {
    setIsPreviewing(false);
    clearInterval(previewIntervalRef.current);
  };

  const startStreaming = () => {
    if (!streamKey) {
      alert("Please enter a stream key.");
      return;
    }

    socket.emit("start_streaming", { user_id: userId, streamKey });
    alert("Streaming started!");
  };

  useEffect(() => {
    const video = videoRef.current;

    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play();
          };
        })
        .catch((error) => console.error("Error accessing webcam: ", error));
    }
  }, []);

  return (
    <div className="App">
      <h1>Mosaic Now</h1>

      <div>
        <p>Select Faces to Exclude:</p>
        {faceOptions.map((faceName) => (
          <label key={faceName}>
            <input
              type="checkbox"
              value={faceName}
              checked={selectedFaceNames.includes(faceName)}
              onChange={() => handleFaceNameChange(faceName)}
            />
            {faceName}
          </label>
        ))}
      </div>

      <div>
        <video ref={videoRef} width="320" height="240" autoPlay />
        <canvas ref={canvasRef} width="320" height="240" hidden></canvas>
      </div>

      <div>
        <input
          type="text"
          placeholder="Face Name to Register"
          value={faceNameToRegister}
          onChange={(e) => setFaceNameToRegister(e.target.value)}
        />
        <button onClick={captureImage}>Capture & Register Face</button>
        {!isPreviewing ? (
          <button onClick={startPreview}>Start Preview</button>
        ) : (
          <button onClick={stopPreview}>Stop Preview</button>
        )}
      </div>

      {processedImage && (
        <div>
          <h2>Processed Frame</h2>
          <img src={processedImage} alt="Processed" />
        </div>
      )}

      <div>
        <input
          type="text"
          placeholder="Enter Stream Key"
          value={streamKey}
          onChange={(e) => setStreamKey(e.target.value)}
        />
        <button onClick={startStreaming}>Start Streaming</button>
      </div>
    </div>
  );
}

export default App;