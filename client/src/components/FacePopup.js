import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000", {
    transports: ["websocket"],
});

function FacePopup({ initialFaceName = "", onClose }) {
    const [faceName, setFaceName] = useState(initialFaceName);
    const [capturedImage, setCapturedImage] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices
                .getUserMedia({ video: true })
                .then((stream) => {
                    video.srcObject = stream;
                    video.play();
                })
                .catch((error) => console.error("Error accessing webcam: ", error));
        }

        return () => {
            if (video.srcObject) {
                video.srcObject.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext("2d");

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL("image/jpeg"));
    };

    const handleAdd = () => {
        if (capturedImage) {
            socket.emit("register_face", { name: faceName, image: capturedImage }, (response) => {
                if (response.success) {
                    alert("Face registered successfully!");
                    onClose();
                } else {
                    alert("Failed to register face.");
                }
            });
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button style={styles.closeButton} onClick={onClose}>
                    ✖
                </button>
                <video ref={videoRef} style={styles.video} autoPlay muted></video>
                <canvas ref={canvasRef} style={styles.canvas} width="320" height="240"></canvas>
                <input
                    type="text"
                    value={faceName}
                    onChange={(e) => setFaceName(e.target.value)}
                    placeholder="Enter face name"
                />
                <button onClick={handleCapture}>Capture</button>
                <button onClick={handleAdd}>Add</button>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    modal: {
        width: "400px",
        backgroundColor: "#ccc",
        borderRadius: "8px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        position: "relative",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    },
    closeButton: {
        position: "absolute",
        top: "10px",
        right: "10px",
        background: "none",
        border: "none",
        fontSize: "20px",
        cursor: "pointer",
    },
    videoContainer: {
        position: "relative",
        backgroundColor: "#333",
        height: "240px",
        borderRadius: "4px",
    },
    video: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "4px",
    },
    capturedImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "4px",
    },
    canvas: {
        display: "none", // 캔버스는 화면에 표시되지 않음
    },
    controls: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    inputGroup: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    label: {
        fontSize: "14px",
        color: "#000",
    },
    input: {
        flexGrow: 1,
        padding: "5px",
        borderRadius: "4px",
        border: "1px solid #ccc",
    },
    captureButton: {
        backgroundColor: "#333",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        padding: "5px 10px",
        cursor: "pointer",
    },
    deleteButton: {
        backgroundColor: "#999",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        padding: "5px 10px",
        cursor: "pointer",
    },
    addButton: {
        backgroundColor: "#4CAF50",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        padding: "5px 10px",
        cursor: "pointer",
    },
};

export default FacePopup;
