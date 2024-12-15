import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000", {
    transports: ["websocket"],
});

function FacePopup({ onClose, initialFaceName }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [faceName, setFaceName] = useState(initialFaceName);

    useEffect(() => {
        const video = videoRef.current;

        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices
                .getUserMedia({ video: true })
                .then((stream) => {
                    video.srcObject = stream;
                    video.onloadedmetadata = () => video.play();
                })
                .catch((error) => console.error("Error accessing webcam:", error));
        }

        return () => {
            if (video?.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach((track) => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        if (!faceName.trim()) {
            alert("Please enter a face name before capturing.");
            return;
        }

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL("image/jpeg"));
    };

    const handleDelete = () => {
        setCapturedImage(null); // 이미지 삭제
    };

    const handleAdd = () => {
        if (!capturedImage || !faceName.trim()) {
            alert("Please capture an image and enter a name.");
            return;
        }

        const getCookieValue = (name) => {
            const matches = document.cookie.match(
                new RegExp(
                    "(?:^|; )" +
                        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
                        "=([^;]*)"
                )
            );
            return matches ? decodeURIComponent(matches[1]) : undefined;
        };

        const userId = getCookieValue("user_id");

        if (!userId) {
            alert("User ID not found. Please log in.");
            return;
        }

        socket.emit("register_face", {
            user_id: userId,
            face_name: faceName,
            image: capturedImage.split(",")[1],
        });

        onClose();
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button style={styles.closeButton} onClick={onClose}>
                    ✖
                </button>
                <video ref={videoRef} autoPlay muted style={styles.video}></video>
                <canvas ref={canvasRef} style={styles.canvas}></canvas>
                <input
                    type="text"
                    value={faceName}
                    onChange={(e) => setFaceName(e.target.value)}
                    placeholder="Enter face name"
                    style={styles.input}
                />
                <div style={styles.buttonGroup}>
                    <button onClick={handleCapture} style={styles.captureButton}>
                        Capture
                    </button>
                    {capturedImage && (
                        <>
                            <button onClick={handleDelete} style={styles.deleteButton}>
                                Delete
                            </button>
                            <button onClick={handleAdd} style={styles.addButton}>
                                Add
                            </button>
                        </>
                    )}
                </div>
                {capturedImage && (
                    <img
                        src={capturedImage}
                        alt="Captured"
                        style={styles.preview}
                    />
                )}
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
        backgroundColor: "#ccc",
        borderRadius: "8px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        position: "relative",
        alignItems: "center",
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
    video: {
        width: "320px",
        height: "240px",
        borderRadius: "8px",
    },
    canvas: {
        display: "none",
    },
    input: {
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #aaa",
        fontSize: "16px",
        width: "100%",
    },
    buttonGroup: {
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        width: "100%",
    },
    captureButton: {
        backgroundColor: "#007BFF",
        color: "#fff",
        padding: "10px 20px",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    deleteButton: {
        backgroundColor: "#f44336",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "10px 20px",
        cursor: "pointer",
    },
    addButton: {
        backgroundColor: "#4CAF50",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "10px 20px",
        cursor: "pointer",
    },
    preview: {
        width: "100%",
        maxWidth: "320px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        marginTop: "10px",
    },
};

export default FacePopup;
