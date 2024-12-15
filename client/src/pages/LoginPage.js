import React from "react";

function LoginPage() {
    const handleKakaoLogin = () => {
        const KAKAO_CLIENT_ID = "748c9492ed282044af98083a57882007";
        const KAKAO_REDIRECT_URI = encodeURIComponent("http://localhost:3000/kakao-callback");
        const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}`;
        window.location.href = kakaoAuthURL;
    };

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <h1 style={styles.title}>MosaicNow</h1>
                <p style={styles.subtitle}>Connect with your Mosaic</p>
                <button style={styles.kakaoButton} onClick={handleKakaoLogin}>
                    <img
                        src="https://developers.kakao.com/assets/img/about/logos/kakaologo.png"
                        alt="Kakao Logo"
                        style={styles.kakaoLogo}
                    />
                    카카오 계정으로 로그인
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #2E2E2E, #1E1E1E)", // 어두운 그라디언트 배경
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    content: {
        textAlign: "center",
        backgroundColor: "rgba(255, 255, 255, 0.1)", // 투명한 흰색 배경
        backdropFilter: "blur(10px)", // 배경 흐리기 효과
        border: "1px solid rgba(255, 255, 255, 0.3)",
        borderRadius: "12px",
        padding: "50px 30px",
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.4)",
        color: "#E0E0E0",
        maxWidth: "400px",
        width: "100%",
    },
    title: {
        fontSize: "28px",
        fontWeight: "600",
        marginBottom: "10px",
        letterSpacing: "1px",
        color: "#FFFFFF",
    },
    subtitle: {
        fontSize: "18px",
        fontWeight: "300",
        marginBottom: "30px",
        color: "#BDBDBD",
    },
    kakaoButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FEE500",
        border: "none",
        borderRadius: "6px",
        width: "280px",
        height: "50px",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: "bold",
        color: "#3C1E1E",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
        margin: "0 auto",
        transition: "transform 0.2s, box-shadow 0.2s",
    },
    kakaoButtonHover: {
        transform: "scale(1.05)",
        boxShadow: "0 6px 12px rgba(0, 0, 0, 0.3)",
    },
    kakaoLogo: {
        width: "24px",
        height: "24px",
        marginRight: "10px",
    },
};

export default LoginPage;
