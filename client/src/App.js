import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { FaceProvider } from "./context/FaceContext";
import FaceListPage from "./pages/FaceListPage";
import SettingPage from "./pages/SettingPage";
import LogoutPage from "./pages/LogoutPage";
import LoginPage from "./pages/LoginPage";
import KakaoCallback from "./pages/KakaoCallback";
import Header from "./components/Header";
import StreamingPage from "./pages/StreamingPage";
import { FaSignOutAlt } from "react-icons/fa";

function App() {
    const [userId, setUserId] = useState(null);
    const [isUserReady, setIsUserReady] = useState(false); // userId가 준비되었는지 확인하는 상태

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

        if (userIdFromCookie) {
            setIsUserReady(true); // userId가 설정되면 준비 상태로 변경
        }
    }, []);

    return (
        <FaceProvider>
            <Router>
                <div style={styles.appContainer}>
                    {/* 로그아웃 아이콘 */}
                    {userId && (
                        <div style={styles.logoutIcon}>
                            <a href="/logout" title="Logout">
                                <FaSignOutAlt size={36} color="#fff" />
                            </a>
                        </div>
                    )}

                    {/* StreamingPage를 userId가 준비된 후에 렌더링 */}
                    {isUserReady && <StreamingPage key={userId} isGlobal />}

                    <div style={styles.pageContentContainer}>
                        <Routes>
                            <Route
                                path="/"
                                element={userId ? <Navigate to="/facelist" /> : <LoginPage />}
                            />
                            <Route path="/kakao-callback" element={<KakaoCallback />} />
                            <Route
                                path="*"
                                element={
                                    <>
                                        <Header />
                                        <Routes>
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
    appContainer: {
        position: "relative",
        backgroundColor: "#333",
        minHeight: "100vh",
        padding: "0 20px",
    },
    logoutIcon: {
        position: "absolute",
        top: "30px",
        right: "30px", // 오른쪽 위로 조정
        cursor: "pointer",
        fontSize: "36px", // 아이콘 크기 증가
    },
    pageContentContainer: {
        backgroundColor: "#333",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "20px",
    },
};

export default App;
