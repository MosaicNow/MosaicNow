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

function App() {
    const [userId, setUserId] = useState(null);

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
    }, []);

    return (
        <FaceProvider>
            <Router>
                <div>
                    {/* StreamingPage를 모든 페이지 상단에 고정 */}
                    {userId && <StreamingPage key={userId} isGlobal />}
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
    pageContentContainer: {
        backgroundColor: "#333",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
};

export default App;
