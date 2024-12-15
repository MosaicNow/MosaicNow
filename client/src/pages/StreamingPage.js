import React, { useState, useRef, useEffect } from "react";
import { useFaceContext } from "../context/FaceContext";
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
    const [processedFrame, setProcessedFrame] = useState("");
    const previewIntervalRef = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

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

    useEffect(() => {
        startWebcam();
        return () => stopWebcam();
    }, []);

    useEffect(() => {
        localStorage.setItem("isPreviewing", JSON.stringify(isPreviewing));
        localStorage.setItem("isStreaming", JSON.stringify(isStreaming));
    }, [isPreviewing, isStreaming]);

    const startWebcam = () => {
        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices
                .getUserMedia({ video: true })
                .then((stream) => {
                    streamRef.current = stream;
                    const video = videoRef.current;
                    if (video) {
                        video.srcObject = stream;
                        video.onloadedmetadata = () => {
                            video.play();
                        };
                    }
                })
                .catch((error) => console.error("Error accessing webcam:", error));
        }
    };

    const stopWebcam = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
    };

    const startPreview = () => {
        if (previewIntervalRef.current) return; // 이미 Interval이 설정되어 있다면 중복 실행 방지
    
        setIsPreviewing(true);
    
        // 기존 이벤트 리스너 제거 후 다시 등록
        socket.off("processed_frame");
        socket.on("processed_frame", (data) => {
            console.log("Received processed frame");
            setProcessedFrame(`data:image/jpeg;base64,${data.image}`);
        });
    
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = 640;
        canvas.height = 480;
    
        const video = videoRef.current;
    
        const restartVideoStream = () => {
            console.warn("Restarting video stream...");
            stopWebcam(); // 기존 스트림 중단
            startWebcam(); // 스트림 재시작
        };
    
        // 프레임 전송 로직
        const sendFrames = () => {
            previewIntervalRef.current = setInterval(() => {
                if (video && video.readyState === 4 && !video.paused) {
                    try {
                        context.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const frame = canvas.toDataURL("image/jpeg").split(",")[1];
                        console.log("Sending video frame to server...");
                        socket.emit("video_frame", {
                            user_id: userId,
                            face_names: selectedFaces,
                            image: frame,
                        });
                    } catch (error) {
                        console.error("Error sending frame:", error);
                    }
                } else {
                    console.warn("Video not ready or paused");
                    video.play().catch(() => {
                        console.error("Error playing video, restarting stream...");
                        restartVideoStream(); // 스트림 재시작
                    });
                }
            }, 200); // 주기 200ms로 설정
        };
    
        if (video) {
            // 비디오 상태 확인 및 재생
            if (video.paused || video.readyState < 4) {
                console.warn("Video is not ready, attempting to play...");
                video.play().then(() => {
                    console.log("Video playback started");
                    sendFrames();
                }).catch(() => {
                    console.error("Failed to play video, restarting stream...");
                    restartVideoStream();
                });
            } else {
                sendFrames();
            }
        } else {
            console.error("Video element is not ready.");
        }
    };
    
    const stopPreview = () => {
        setIsPreviewing(false);
        setProcessedFrame("");
        socket.off("processed_frame");
    
        if (previewIntervalRef.current) {
            clearInterval(previewIntervalRef.current);
            previewIntervalRef.current = null;
        }
    
        // 웹캠 스트림 재시작
        stopWebcam(); // 기존 스트림 정리
        startWebcam(); // 새로 웹캠 시작
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
        setIsStreaming(false);
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>MosaicNow</h1>
            
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
            <div style={styles.webcamWrapper}>
                {processedFrame ? (
                    <img
                        src={processedFrame}
                        alt="Processed Frame"
                        style={styles.processedFrame}
                    />
                ) : (
                    <video ref={videoRef} autoPlay muted style={styles.webcam}></video>
                )}
            </div>
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
        fontSize: "36px",
        fontWeight: "bold", 
        letterSpacing: "2px",
        textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
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
    webcamWrapper: {
        display: "flex",
        justifyContent: "center",
        paddingBottom: "20px",
    },
    webcam: {
        width: "640px",
        height: "480px",
        border: "2px solid #fff",
        borderRadius: "8px",
    },
    processedFrame: {
        width: "640px",
        height: "480px",
        border: "2px solid #fff",
        borderRadius: "8px",
    },
    placeholder: {
        width: "640px",
        height: "480px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#222",
        color: "#aaa",
        fontSize: "18px",
        border: "2px solid #fff",
        borderRadius: "8px",
    },
    buttonGroup: {
        display: "flex",
        justifyContent: "center",
        gap: "20px",
    },
    
    previewButton: {
        background: "linear-gradient(135deg, #6EC1E4, #007BFF)",
        color: "#fff",
        border: "none",
        borderRadius: "25px",
        padding: "12px 24px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
    },
    
    startButton: {
        background: "linear-gradient(135deg, #34D399, #28A745)",
        color: "#fff",
        border: "none",
        borderRadius: "25px",
        padding: "12px 24px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
    },
    
    stopButton: {
        background: "linear-gradient(135deg, #F87171, #FF4B4B)",
        color: "#fff",
        border: "none",
        borderRadius: "25px",
        padding: "12px 24px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
    },
    
    startButtonDisabled: {
        background: "linear-gradient(135deg, #D1D5DB, #A1A1A1)",
        color: "#666",
        border: "none",
        borderRadius: "25px",
        padding: "12px 24px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "not-allowed",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    };

export default StreamingPage;
