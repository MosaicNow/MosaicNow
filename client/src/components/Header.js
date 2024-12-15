import React from "react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <header style={styles.header}>
            <div style={styles.sliderContainer}>
                <div
                    style={{
                        ...styles.sliderBackground,
                        transform: isActive("/facelist")
                            ? "translateX(0)"
                            : "translateX(100%)",
                    }}
                />
                <Link
                    to="/facelist"
                    style={isActive("/facelist") ? styles.activeButton : styles.button}
                >
                    Face List
                </Link>
                <Link
                    to="/settings"
                    style={isActive("/settings") ? styles.activeButton : styles.button}
                >
                    Settings
                </Link>
            </div>
        </header>
    );
};

const styles = {
    header: {
        backgroundColor: "#333", // 헤더 배경색
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px 0",
    },
    sliderContainer: {
        display: "flex",
        position: "relative",
        backgroundColor: "#444",
        borderRadius: "50px",
        width: "300px",
        height: "50px",
        alignItems: "center",
        justifyContent: "space-around",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
    },
    sliderBackground: {
        position: "absolute",
        top: "5px",
        left: "5px",
        width: "140px",
        height: "40px",
        backgroundColor: "#61dafb",
        borderRadius: "50px",
        transition: "transform 0.3s ease",
    },
    button: {
        position: "relative",
        zIndex: 1,
        color: "#ddd",
        textDecoration: "none",
        fontWeight: "bold",
        fontSize: "16px",
        textAlign: "center",
        width: "50%",
        height: "100%",
        lineHeight: "50px", // 수직 중앙 정렬
    },
    activeButton: {
        position: "relative",
        zIndex: 1,
        color: "black",
        textDecoration: "none",
        fontWeight: "bold",
        fontSize: "16px",
        textAlign: "center",
        width: "50%",
        height: "100%",
        lineHeight: "50px",
    },
};

export default Header;
