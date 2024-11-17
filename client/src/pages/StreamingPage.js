import React, { useState, useRef } from "react";
import { useFaceContext } from "../context/FaceContext";
import io from "socket.io-client";

const socket = io("http://localhost:5000", {
    transports: ["websocket"],
});

function StreamingPage() {
    const { selectedFaces } = useFaceContext(); // Context 사용
    const [streamKey, setStreamKey] = useState("");
    const [streamUrl, setStreamUrl] = useState("");
    const [isPreviewing, setIsPreviewing] = useState(false);
    const previewIntervalRef = useRef(null);

    const startPreview = () => {
        const video = document.querySelector("video"); // Webcam.js의 비디오 참조
        if (!video) {
            alert("Webcam is not available.");
            return;
        }

        setIsPreviewing(true);
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");

        previewIntervalRef.current = setInterval(() => {
            if (video.readyState === 4) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const frame = canvas.toDataURL("image/jpeg").split(",")[1];
                socket.emit("video_frame", {
                    streamKey,
                    streamUrl,
                    face_names: selectedFaces, // 선택된 얼굴 추가
                    image: frame,
                });
            }
        }, 100);
    };

    const stopPreview = () => {
        setIsPreviewing(false);
        clearInterval(previewIntervalRef.current);
    };

    const startStreaming = () => {
        if (!streamKey || !streamUrl) {
            alert("Please enter both Stream Key and Stream URL.");
            return;
        }
        socket.emit("start_streaming", { streamKey, streamUrl });
        alert("Streaming started!");
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Streaming</h1>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Stream Key</label>
                <input
                    type="text"
                    value={streamKey}
                    onChange={(e) => setStreamKey(e.target.value)}
                    style={styles.input}
                    placeholder="Enter Stream Key"
                />
            </div>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Stream URL</label>
                <input
                    type="text"
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    style={styles.input}
                    placeholder="Enter Stream URL"
                />
            </div>
            <div style={styles.buttonGroup}>
                <button
                    style={styles.previewButton}
                    onClick={isPreviewing ? stopPreview : startPreview}
                >
                    {isPreviewing ? "Stop Preview" : "Preview"}
                </button>
                <button style={styles.startButton} onClick={startStreaming}>
                    Start
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        backgroundColor: "#333",
        padding: "20px",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
    },
    header: {
        color: "#fff",
        fontSize: "24px",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "100%",
        maxWidth: "400px",
    },
    label: {
        color: "#ccc",
        fontSize: "14px",
    },
    input: {
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #555",
        backgroundColor: "#555",
        color: "#fff",
        fontSize: "14px",
        width: "100%",
    },
    buttonGroup: {
        display: "flex",
        justifyContent: "center",
        gap: "20px",
    },
    previewButton: {
        backgroundColor: "#007BFF",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "10px 20px",
        cursor: "pointer",
        fontSize: "16px",
    },
    startButton: {
        backgroundColor: "#28A745",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "10px 20px",
        cursor: "pointer",
        fontSize: "16px",
    },
};

export default StreamingPage;
