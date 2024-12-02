import React, { useState, useEffect } from "react";

const SettingPage = () => {
    const [audioDevices, setAudioDevices] = useState([]);
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedAudioDevice, setSelectedAudioDevice] = useState("");
    const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
    const [isCameraOn, setIsCameraOn] = useState(true); // 카메라 상태 관리
    const [isMicOn, setIsMicOn] = useState(true); // 마이크 상태
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isAudioSharing, setIsAudioSharing] = useState(false);

    useEffect(() => {
        // Fetch available audio and video devices
        navigator.mediaDevices.enumerateDevices().then((devices) => {
            const audio = devices.filter((device) => device.kind === "audioinput");
            const video = devices.filter((device) => device.kind === "videoinput");
            setAudioDevices(audio);
            setVideoDevices(video);

            if (audio.length > 0) setSelectedAudioDevice(audio[0].deviceId);
            if (video.length > 0) setSelectedVideoDevice(video[0].deviceId);
        });
    }, []);

    const toggleCamera = () => {
        setIsCameraOn((prev) => !prev);
    };

    const handleMicToggle = () => {
        setIsMicOn((prev) => !prev);
    };

    const handleScreenSharingToggle = () => setIsScreenSharing((prev) => !prev);
    const handleAudioSharingToggle = () => setIsAudioSharing((prev) => !prev);

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Settings</h1>

            <div style={styles.deviceSelection}>
                {/* Audio Device Selection */}
                <div style={styles.deviceGroup}>
                    <label style={styles.label}>Audio</label>
                    <select
                        value={selectedAudioDevice}
                        onChange={(e) => setSelectedAudioDevice(e.target.value)}
                        style={styles.select}
                    >
                        {audioDevices.map((device) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || "Unknown Audio Device"}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Video Device Selection */}
                <div style={styles.deviceGroup}>
                    <label style={styles.label}>Camera</label>
                    <select
                        value={selectedVideoDevice}
                        onChange={(e) => setSelectedVideoDevice(e.target.value)}
                        style={styles.select}
                    >
                        {videoDevices.map((device) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || "Unknown Video Device"}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Camera and Mic Toggle Buttons */}
                <div style={styles.buttonGroup}>
                    <button
                        style={isCameraOn ? styles.activeButton : styles.inactiveButton}
                        onClick={toggleCamera}
                    >
                        {isCameraOn ? "Camera On" : "Camera Off"}
                    </button>
                    <button
                        style={isMicOn ? styles.activeButton : styles.inactiveButton}
                        onClick={handleMicToggle}
                    >
                        {isMicOn ? "Mic On" : "Mic Off"}
                    </button>
                </div>
            </div>

            {/* Screen and Audio Sharing Options */}
            <div style={styles.sharingOptions}>
                <div style={styles.sliderContainer}>
                    <span style={styles.sliderLabel}>Sharing the screen</span>
                    <label style={styles.switch}>
                        <input
                            type="checkbox"
                            checked={isScreenSharing}
                            onChange={handleScreenSharingToggle}
                            style={styles.hiddenCheckbox}
                        />
                        <span
                            style={{
                                ...styles.slider,
                                ...(isScreenSharing ? styles.sliderOn : {}),
                            }}
                        >
                            <span
                                style={{
                                    ...styles.knob,
                                    ...(isScreenSharing ? styles.knobOn : {}),
                                }}
                            ></span>
                        </span>
                    </label>
                </div>

                <div style={styles.sliderContainer}>
                    <span style={styles.sliderLabel}>Sharing the desktop audio</span>
                    <label style={styles.switch}>
                        <input
                            type="checkbox"
                            checked={isAudioSharing}
                            onChange={handleAudioSharingToggle}
                            style={styles.hiddenCheckbox}
                        />
                        <span
                            style={{
                                ...styles.slider,
                                ...(isAudioSharing ? styles.sliderOn : {}),
                            }}
                        >
                            <span
                                style={{
                                    ...styles.knob,
                                    ...(isAudioSharing ? styles.knobOn : {}),
                                }}
                            ></span>
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
};

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
    deviceSelection: {
        display: "flex",
        flexDirection: "row",
        gap: "20px",
    },
    deviceGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    label: {
        color: "#ccc",
        fontSize: "14px",
    },
    select: {
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #555",
        backgroundColor: "#555",
        color: "#fff",
        fontSize: "14px",
    },
    buttonGroup: {
        display: "flex",
        gap: "10px",
    },
    activeButton: {
        backgroundColor: "#007BFF",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "10px 20px",
        cursor: "pointer",
        fontSize: "16px",
    },
    inactiveButton: {
        backgroundColor: "#555",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        padding: "10px 20px",
        cursor: "pointer",
        fontSize: "16px",
    },
    sharingOptions: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        width: "100%",
    },
    sliderContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
    },
    sliderLabel: {
        color: "#ccc",
        fontSize: "16px",
        marginRight: "20px",
    },
    switch: {
        position: "relative",
        display: "inline-block",
        width: "50px",
        height: "24px",
    },
    hiddenCheckbox: {
        display: "none",
    },
    slider: {
        position: "absolute",
        cursor: "pointer",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#ccc",
        transition: "0.4s",
        borderRadius: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
    },
    sliderOn: {
        backgroundColor: "#4CAF50",
    },
    knob: {
        position: "absolute",
        width: "20px",
        height: "20px",
        backgroundColor: "#fff",
        borderRadius: "50%",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        transition: "0.4s",
        transform: "translateX(2px)",
    },
    knobOn: {
        transform: "translateX(26px)",
    },
};

export default SettingPage;
