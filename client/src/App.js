import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

function App() {
  const [userId] = useState("1"); // userId를 1로 하드코딩
  const [faceOptions, setFaceOptions] = useState(["hj", "yr", "sc"]);
  const [selectedFaceNames, setSelectedFaceNames] = useState([]);
  const [faceNameToRegister, setFaceNameToRegister] = useState("");
  const [streamKey, setStreamKey] = useState("");
  const [processedImage, setProcessedImage] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const previewIntervalRef = useRef(null);
  const peerConnectionRef = useRef(null);

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

  const handleFaceNameChange = (faceName) => {
    setSelectedFaceNames((prevSelected) =>
      prevSelected.includes(faceName)
        ? prevSelected.filter((name) => name !== faceName)
        : [...prevSelected, faceName]
    );
  };

  useEffect(() => {
    if (isPreviewing) {
      stopPreview();
      startPreview();
    }
  }, [selectedFaceNames]);

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
    setFaceNameToRegister("");
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

  // 오디오 WebRTC 연결 시작
  const startWebRTCAudio = async () => {
    const peerConnection = new RTCPeerConnection();
    peerConnectionRef.current = peerConnection;

    // 오디오 스트림 가져오기
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    // ICE candidate 수집
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc_ice_candidate", { candidate: event.candidate });
      }
    };

    // 서버로 offer 보내기
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("webrtc_offer", { sdp: peerConnection.localDescription.sdp, type: offer.type });
  };

  useEffect(() => {
    socket.on("webrtc_answer", async (data) => {
      const answer = new RTCSessionDescription(data);
      await peerConnectionRef.current.setRemoteDescription(answer);
    });

    socket.on("webrtc_ice_candidate", async (data) => {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log("ICE candidate added successfully:", data.candidate);
      } catch (error) {
        console.error("Error adding received ICE candidate", error);
      }
    });

    return () => {
      socket.off("webrtc_answer");
      socket.off("webrtc_ice_candidate");
    };
  }, []);

  const startStreaming = () => {
    if (!streamKey) {
      alert("Please enter a stream key.");
      return;
    }
    socket.emit("start_streaming", { user_id: userId, streamKey });
    alert("Streaming started!");

    // 오디오 WebRTC 연결 시작
    startWebRTCAudio();
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