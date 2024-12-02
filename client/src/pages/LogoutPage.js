import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function LogoutPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // 모든 쿠키를 삭제하는 함수
        const clearCookies = () => {
            const cookies = document.cookie.split(";");

            for (const cookie of cookies) {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            }
        };

        clearCookies();
    
        window.location.reload(); 

        navigate("/");
    }, [navigate]);

    return (
        <div style={styles.container}>
            <h1 style={styles.message}>Logging out...</h1>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f5f5f5",
    },
    message: {
        fontSize: "24px",
        color: "#333",
    },
};

export default LogoutPage;
