import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function KakaoCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
            axios
                .post("wss://mosaic-now.com/api/auth/kakao-login", { code }, { withCredentials: true })
                .then((response) => {
                    console.log("Login successful:", response.data);
                    navigate("https://mosaic-now.com/facelist");
                })
                .catch((error) => {
                    console.error("Login failed:", error);
                });
        }
    }, [navigate]);

    return <div>Logging in...</div>;
}

export default KakaoCallback;
