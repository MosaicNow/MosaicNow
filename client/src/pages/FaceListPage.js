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
            // 중복 제거
            const uniqueFaces = Array.from(
                new Set(data.faces.map((face) => face.face_name))
            ).map((name) => ({ face_name: name }));

            setFaceList(uniqueFaces); // 중복 제거된 얼굴 목록 설정
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
            <h1 style={styles.header}>Face List</h1>
            {loading ? (
                <p style={styles.loadingMessage}>Loading...</p>
            ) : (
                <>
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
                                style={styles.deleteButton}
                                onClick={() => deleteFace(face.face_name)}
                            >
                                🗑
                            </button>
                            <button
                                style={styles.addButton}
                                onClick={() => openPopup(face.face_name)}
                            >
                                Add
                            </button> 
                        </div>
                    ))}
                </>
            )}
            <button style={styles.addFaceButton} onClick={() => openPopup(null)}>
                Add New Face
            </button>
            {isPopupOpen && (
                <FacePopup
                    initialFaceName={currentFaceName || ""}
                    onClose={closePopup}
                />
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
        gap: "10px",
    },
    header: {
        color: "#fff",
        textAlign: "center",
    },
    faceItem: {
        display: "flex",
        alignItems: "center",
        backgroundColor: "#555",
        padding: "10px",
        borderRadius: "5px",
        gap: "10px",
    },
    faceName: {
        flexGrow: 1,
        color: "#fff",
        fontSize: "16px",
    },
    addButton: {
        backgroundColor: "#007BFF",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        padding: "5px 10px",
        cursor: "pointer",
    },
    addFaceButton: {
        backgroundColor: "#4CAF50",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        padding: "10px 20px",
        cursor: "pointer",
        alignSelf: "center",
    },
};

export default FaceListPage;
