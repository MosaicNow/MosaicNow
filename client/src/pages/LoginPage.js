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
                <h1 style={styles.title}>Welcome to MosaicNow</h1>
                <p style={styles.subtitle}>Sign in</p>
                <button style={styles.kakaoButton} onClick={handleKakaoLogin}>
                    <img
                        src="https://developers.kakao.com/assets/img/about/logos/kakaologo.png" // 신뢰할 수 있는 URL 또는 로컬 경로
                        alt="Kakao Logo"
                        style={styles.kakaoLogo}
                    />
                    카카오 로그인
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        width: "100vw", // 화면 전체 너비
        height: "100vh", // 화면 전체 높이
        backgroundColor: "#2c2c2c", // 어두운 회색 배경
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: 0,
        padding: 0,
    },
    content: {
        textAlign: "center",
        backgroundColor: "rgba(255, 255, 255, 0.8)", // 반투명 흰색
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        maxWidth: "400px",
        width: "100%",
    },
    title: {
        fontSize: "24px",
        fontWeight: "bold",
        color: "#333",
        marginBottom: "10px",
    },
    subtitle: {
        fontSize: "16px",
        color: "#333",
        marginBottom: "20px",
    },
    kakaoButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center", // 버튼 중앙 정렬
        backgroundColor: "#FEE500",
        border: "none",
        borderRadius: "6px",
        width: "240px",
        height: "50px",
        cursor: "pointer",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        fontSize: "16px",
        fontWeight: "bold",
        color: "#000000",
        margin: "0 auto", // 버튼을 부모 요소의 중앙으로 정렬
    },
    kakaoLogo: {
        width: "20px",
        height: "20px",
        marginRight: "8px",
    },
};

export default LoginPage;
