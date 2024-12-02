import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { FaceProvider } from "./context/FaceContext";
import StreamingPage from "./pages/StreamingPage";
import FaceListPage from "./pages/FaceListPage";
import SettingPage from "./pages/SettingPage";
import LogoutPage from "./pages/LogoutPage";
import LoginPage from "./pages/LoginPage";
import KakaoCallback from "./pages/KakaoCallback";
import Header from "./components/Header";
import Webcam from "./components/Webcam";

function App() {
    const [userId, setUserId] = useState(null);

    // 쿠키에서 특정 값 가져오기
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

    useEffect(() => {
        const userIdFromCookie = getCookieValue("user_id");
        setUserId(userIdFromCookie);
    }, []); // 처음 렌더링 시 userId를 설정

    return (
        <FaceProvider>
            <Router>
                <div>
                    {/* userId가 있을 때만 Webcam을 렌더링 */}
                    {userId && (
                        <div style={styles.webcamContainer}>
                            <Webcam key={userId} /> {/* userId가 변하면 Webcam을 다시 렌더링 */}
                        </div>
                    )}
                    <div style={styles.pageContentContainer}>
                        <Routes>
                            {/* 기본 경로에서 user_id 여부에 따라 조건부 렌더링 */}
                            <Route
                                path="/"
                                element={userId ? <Navigate to="/streaming" /> : <LoginPage />}
                            />
                            <Route path="/kakao-callback" element={<KakaoCallback />} />
                            <Route
                                path="*"
                                element={
                                    <>
                                        <Header />
                                        <Routes>
                                            <Route path="/streaming" element={<StreamingPage />} />
                                            <Route path="/facelist" element={<FaceListPage />} />
                                            <Route path="/settings" element={<SettingPage />} />
                                            <Route path="/logout" element={<LogoutPage />} />
                                        </Routes>
                                    </>
                                }
                            />
                        </Routes>
                    </div>
                </div>
            </Router>
        </FaceProvider>
    );
}

const styles = {
    webcamContainer: {
        backgroundColor: "black",
        display: "flex",
        padding: "40px 0",
        justifyContent: "center",
    },
    pageContentContainer: {
        backgroundColor: "#333",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
};

export default App;
