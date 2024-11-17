// src/components/Webcam.js
import React from "react";
import { useWebcamContext } from "../context/WebcamContext";

function Webcam() {
    const { videoRef } = useWebcamContext();

    return (
        <div style={styles.webcamWrapper}>
            <video ref={videoRef} autoPlay style={styles.webcam}></video>
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
};

export default Webcam;
