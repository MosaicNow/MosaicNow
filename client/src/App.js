// src/App.js

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { FaceProvider } from "./context/FaceContext";
import { WebcamProvider } from "./context/WebcamContext"; // WebcamContext 추가
import StreamingPage from "./pages/StreamingPage";
import FaceListPage from "./pages/FaceListPage";
import SettingPage from "./pages/SettingPage"; // 추가된 SettingPage
import LoginPage from "./pages/LoginPage";
import Header from "./components/Header";
import Webcam from "./components/Webcam";

function App() {
    return (
        <FaceProvider>
            <WebcamProvider>
                <Router>
                    <div>
                        {/* 웹캠 영역 */}
                        <div style={styles.webcamContainer}>
                            <Webcam />
                        </div>

                        {/* 헤더와 라우팅 영역 */}
                        <div style={styles.pageContentContainer}>
                            <div style={styles.headerContainer}>
                                <Header />
                            </div>
                            <Routes>
                                <Route path="/" element={<LoginPage />} />
                                <Route path="/streaming" element={<StreamingPage />} />
                                <Route path="/facelist" element={<FaceListPage />} />
                                <Route path="/settings" element={<SettingPage />} /> {/* Settings 페이지 추가 */}
                            </Routes>
                        </div>
                    </div>
                </Router>
            </WebcamProvider>
        </FaceProvider>
    );
}

const styles = {
    webcamContainer: {
        backgroundColor: "black", // 웹캠 배경색
        display: "flex",
        padding: "40px 0",
        justifyContent: "center",
    },
    headerContainer: {
        backgroundColor: "#333", // 헤더 배경색
        width: "100%",
        paddingBottom: "20px",
        display: "flex",
        justifyContent: "center",
    },
    pageContentContainer: {
        backgroundColor: "#333", // 콘텐츠 배경색
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
};

export default App;
