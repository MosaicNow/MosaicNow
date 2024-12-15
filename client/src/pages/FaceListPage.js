import React, { useState, useEffect } from "react";
import FacePopup from "../components/FacePopup";
import { useFaceContext } from "../context/FaceContext";
import io from "socket.io-client";

const socket = io("http://localhost:5000", {
    transports: ["websocket"],
});

function FaceListPage() {
    const { faceList, setFaceList, selectedFaces, setSelectedFaces } = useFaceContext();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [currentFaceName, setCurrentFaceName] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hoveredButton, setHoveredButton] = useState(null); // 호버 상태 관리

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

    const fetchFaceList = () => {
        const userId = getCookieValue("user_id");

        if (!userId) {
            alert("User ID not found. Please log in.");
            return;
        }

        setLoading(true);
        socket.emit("fetch_faces_request", { user_id: userId });
    };

    useEffect(() => {
        socket.on("fetch_faces_result", (data) => {
            const uniqueFaces = Array.from(
                new Set(data.faces.map((face) => face.face_name))
            ).map((name) => ({ face_name: name }));

            setFaceList(uniqueFaces);
            setLoading(false);
        });

        socket.on("delete_face_result", (data) => {
            if (data.success) {
                fetchFaceList();
            } else {
                alert("Failed to delete face.");
            }
        });

        return () => {
            socket.off("fetch_faces_result");
            socket.off("delete_face_result");
        };
    }, []);

    useEffect(() => {
        fetchFaceList();
    }, []);

    const openPopup = (faceName) => {
        setCurrentFaceName(faceName);
        setIsPopupOpen(true);
    };

    const closePopup = () => {
        setCurrentFaceName(null);
        setIsPopupOpen(false);
    };

    const handleFaceNameChange = (faceName) => {
        setSelectedFaces((prevSelected) =>
            prevSelected.includes(faceName)
                ? prevSelected.filter((name) => name !== faceName)
                : [...prevSelected, faceName]
        );
    };

    const deleteFace = (faceName) => {
        const userId = getCookieValue("user_id");

        if (!userId) {
            alert("User ID not found. Please log in.");
            return;
        }

        socket.emit("delete_face", { user_id: userId, face_name: faceName });
    };

    return (
        <div style={styles.container}>
            {loading ? (
                <p style={styles.loadingMessage}>Loading...</p>
            ) : (
                <div>
                    {faceList.map((face) => (
                        <div key={face.face_name} style={styles.faceItem}>
                            <span style={styles.faceName}>{face.face_name}</span>
                            <input
                                type="checkbox"
                                checked={selectedFaces.includes(face.face_name)}
                                onChange={() => handleFaceNameChange(face.face_name)}
                                style={styles.checkbox}
                            />
                            <button
                                style={{
                                    ...styles.addButton,
                                    ...(hoveredButton === face.face_name + "-add"
                                        ? styles.hoverEffect
                                        : {}),
                                }}
                                onMouseEnter={() => setHoveredButton(face.face_name + "-add")}
                                onMouseLeave={() => setHoveredButton(null)}
                                onClick={() => openPopup(face.face_name)}
                            >
                                Add
                            </button>
                            <button
                                style={{
                                    ...styles.deleteButton,
                                    ...(hoveredButton === face.face_name + "-delete"
                                        ? styles.hoverEffect
                                        : {}),
                                }}
                                onMouseEnter={() => setHoveredButton(face.face_name + "-delete")}
                                onMouseLeave={() => setHoveredButton(null)}
                                onClick={() => deleteFace(face.face_name)}
                            >
                                🗑
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <button
                style={{
                    ...styles.addFaceButton,
                    ...(hoveredButton === "addNew" ? styles.hoverEffect : {}),
                }}
                onMouseEnter={() => setHoveredButton("addNew")}
                onMouseLeave={() => setHoveredButton(null)}
                onClick={() => openPopup(null)}
            >
                Add New Face
            </button>
            {isPopupOpen && (
                <FacePopup initialFaceName={currentFaceName || ""} onClose={closePopup} />
            )}
        </div>
    );
}


const styles = {
    container: {
        backgroundColor: "#333",
        padding: "20px",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
    },
    faceItem: {
        display: "flex",
        alignItems: "center", 
        justifyContent: "space-between",
        backgroundColor: "#444",
        padding: "14px 20px",
        borderRadius: "10px",
        gap: "10px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
        marginBottom: "15px",
        width: "100%",
    },
    faceName: {
        flexGrow: 1,
        color: "#fff",
        fontSize: "18px",
        fontWeight: "500",
    },
    checkbox: {
        transform: "scale(1.2)",
    },
    addButton: {
        backgroundColor: "#007BFF",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        padding: "6px 12px",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },
    deleteButton: {
        backgroundColor: "#FF4B4B",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        padding: "6px 12px",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },
    addFaceButton: {
        backgroundColor: "#4CAF50",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "12px 24px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
        marginTop: "20px",
        transition: "all 0.3s ease",
    },
    hoverEffect: {
        transform: "scale(1.05)",
        filter: "brightness(90%)",
    },
};

export default FaceListPage;
