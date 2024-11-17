// src/components/Header.js

import React from "react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <header style={styles.header}>
            <nav style={styles.nav}>
                <Link
                    to="/streaming"
                    style={isActive("/streaming") ? styles.activeButton : styles.button}
                >
                    Streaming
                </Link>
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
                <button style={styles.button} disabled>
                    Account
                </button>
            </nav>
        </header>
    );
};

const styles = {
    header: {
        backgroundColor: "#333", // 헤더 배경색
        display: "flex",
        justifyContent: "center",
        padding: "10px 0",
    },
    nav: {
        display: "flex",
        gap: "15px",
    },
    button: {
        backgroundColor: "#555",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "5px",
        cursor: "pointer",
        fontSize: "16px",
    },
    activeButton: {
        backgroundColor: "#61dafb",
        color: "black",
        border: "none",
        padding: "10px 20px",
        borderRadius: "5px",
        cursor: "pointer",
        fontSize: "16px",
    },
};

export default Header;
