import React, { useEffect, useRef } from "react";

function Webcam({ isPopupOpen, processedFrame, isPreviewing }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (isPopupOpen) return; // 팝업이 열려 있으면 렌더링 중지

        const video = videoRef.current;
        
        if (!video) {
            console.error("Video element is not available.");
            return;
        }

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

        return () => {
            if (video?.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach((track) => track.stop());
            }
        };
    }, [isPopupOpen]);

    return (
        <div style={styles.webcamWrapper}>
            {!isPreviewing ? (
                <video ref={videoRef} autoPlay muted style={styles.webcam}></video>
            ) : (
                <img
                    src={processedFrame}
                    alt="Processed Frame"
                    style={styles.processedFrame}
                />
            )}
        </div>
    );
}

const styles = {
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
};

export default Webcam;
