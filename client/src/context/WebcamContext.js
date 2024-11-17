// src/context/WebcamContext.js
import React, { createContext, useState, useEffect, useRef } from "react";

const WebcamContext = createContext();

export const WebcamProvider = ({ children }) => {
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);

    useEffect(() => {
        if (isCameraOn) {
            navigator.mediaDevices
                .getUserMedia({ video: true })
                .then((stream) => {
                    setStream(stream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();
                    }
                })
                .catch((error) => console.error("Error accessing webcam:", error));
        } else {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
                setStream(null);
            }
        }
    }, [isCameraOn]);

    const toggleCamera = () => setIsCameraOn((prev) => !prev);

    return (
        <WebcamContext.Provider value={{ isCameraOn, toggleCamera, videoRef }}>
            {children}
        </WebcamContext.Provider>
    );
};

export const useWebcamContext = () => React.useContext(WebcamContext);
