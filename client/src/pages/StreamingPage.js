import React, { useState, useRef, useEffect } from "react";
import { useFaceContext } from "../context/FaceContext";
import Webcam from "../components/Webcam";
import io from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000", {
    transports: ["websocket"],
});

function StreamingPage() {
    const { selectedFaces } = useFaceContext();
    const [streamKey, setStreamKey] = useState("");
    const [isPreviewing, setIsPreviewing] = useState(
        JSON.parse(localStorage.getItem("isPreviewing")) || false
    );
    const [isStreaming, setIsStreaming] = useState(
        JSON.parse(localStorage.getItem("isStreaming")) || false
    );
    const [processedFrame, setProcessedFrame] = useState(""); // 모자이크 화면
    const previewIntervalRef = useRef(null); // setInterval 참조 저장

    const getUserIdFromCookie = () => {
        const match = document.cookie.match(/user_id=([^;]+)/);
        return match ? match[1] : null;
    };

    const userId = getUserIdFromCookie();

    useEffect(() => {
        const fetchStreamKey = async () => {
            if (!userId) return;

            try {
                const response = await axios.get(`http://localhost:8000/streamingkey/${userId}`);
                if (response.data.streamKey) setStreamKey(response.data.streamKey);
            } catch (error) {
                console.error("Error fetching streamKey:", error);
            }
        };

        fetchStreamKey();
    }, [userId]);

    // Preview 상태 유지
    useEffect(() => {
        if (isPreviewing) {
            startPreview();
        }
        return () => {
            stopPreview();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 상태가 변경될 때 로컬스토리지에 저장
    useEffect(() => {
        localStorage.setItem("isPreviewing", JSON.stringify(isPreviewing));
        localStorage.setItem("isStreaming", JSON.stringify(isStreaming));
    }, [isPreviewing, isStreaming]);

    const startPreview = () => {
        setIsPreviewing(true);

        // 모자이크 프레임을 서버에서 수신
        socket.on("processed_frame", (data) => {
            setProcessedFrame(`data:image/jpeg;base64,${data.image}`);
        });

        const video = document.querySelector("video");
        if (!video) {
            alert("Webcam not available.");
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const context = canvas.getContext("2d");

        previewIntervalRef.current = setInterval(() => {
            if (video.readyState === 4) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const frame = canvas.toDataURL("image/jpeg").split(",")[1];
                socket.emit("video_frame", {
                    user_id: userId,
                    face_names: selectedFaces,
                    image: frame,
                });
            }
        }, 100);
    };

    const stopPreview = () => {
        setIsPreviewing(false);
        setProcessedFrame(""); // 모자이크 화면 초기화
        socket.off("processed_frame"); // 서버 이벤트 리스너 제거

        if (previewIntervalRef.current) {
            clearInterval(previewIntervalRef.current); // 프레임 전송 중단
            previewIntervalRef.current = null; // 참조 초기화
        }
    };

    const startStreaming = async () => {
        if (!streamKey) {
            alert("Please enter a Stream Key.");
            return;
        }

        if (!userId) {
            alert("User ID is missing. Please log in again.");
            return;
        }

        try {
            const response = await axios.post("http://localhost:8000/streamingkey/update-streamkey", {
                user_id: userId,
                streamKey,
            });

            if (response.data.message === "StreamKey updated successfully") {
                alert("StreamKey updated and streaming started!");
                socket.emit("start_streaming", { user_id: userId, streamKey });
                setIsStreaming(true);
            } else {
                alert("Failed to update StreamKey");
            }
        } catch (error) {
            console.error("Error updating StreamKey:", error);
            alert("An error occurred while updating the StreamKey.");
        }
    };

    const stopStreaming = () => {
        socket.emit("stop_streaming", { user_id: userId });
        alert("Streaming stopped!");
        stopPreview();
        setIsStreaming(false);
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
            <Webcam
                isPopupOpen={false}
                processedFrame={processedFrame} // 모자이크 프레임 전달
                isPreviewing={isPreviewing}
            />
            <div style={styles.buttonGroup}>
                <button
                    style={styles.previewButton}
                    onClick={isPreviewing ? stopPreview : startPreview}
                >
                    {isPreviewing ? "Stop Preview" : "Preview"}
                </button>
                <button
                    style={
                        isPreviewing
                            ? isStreaming
                                ? styles.stopButton
                                : styles.startButton
                            : styles.startButtonDisabled
                    }
                    onClick={isStreaming ? stopStreaming : startStreaming}
                    disabled={!isPreviewing}
                >
                    {isStreaming ? "Stop" : "Start"}
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
    stopButton: {
        backgroundColor: "#FF0000",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "10px 20px",
        cursor: "pointer",
        fontSize: "16px",
    },
    startButtonDisabled: {
        backgroundColor: "#aaa",
        color: "#666",
        border: "none",
        borderRadius: "4px",
        padding: "10px 20px",
        cursor: "not-allowed",
        fontSize: "16px",
    },
};

export default StreamingPage;
