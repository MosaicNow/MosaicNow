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

    useEffect(() => {
        socket.on("register_result", (data) => {
            alert(data.message); // 등록 결과 표시
            if (data.success) {
                fetchFaceList();
            }
        });

        return () => {
            socket.off("register_result");
        };
    }, []);

    const fetchFaceList = () => {
        setLoading(true);
        socket.emit("fetch_faces", {}, (response) => {
            setFaceList(response.faces || []);
            setLoading(false);
        });
    };

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

    const deleteFace = (faceName) => {
        socket.emit("delete_face", { name: faceName }, (response) => {
            if (response.success) {
                fetchFaceList();
            } else {
                alert("Failed to delete face.");
            }
        });
    };

    const handleFaceNameChange = (faceName) => {
        setSelectedFaces((prevSelected) =>
            prevSelected.includes(faceName)
                ? prevSelected.filter((name) => name !== faceName)
                : [...prevSelected, faceName]
        );
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Face List</h1>
            {loading ? (
                <p style={styles.loadingMessage}>Loading...</p>
            ) : faceList.length > 0 ? (
                faceList.map((face) => (
                    <div key={face.name} style={styles.faceItem}>
                        <span style={styles.faceName}>{face.name}</span>
                        <img
                            src={face.images[0]}
                            alt={`Face of ${face.name}`}
                            style={styles.faceImage}
                        />
                        <input
                            type="checkbox"
                            checked={selectedFaces.includes(face.name)}
                            onChange={() => handleFaceNameChange(face.name)}
                            style={styles.checkbox}
                        />
                        <button
                            style={styles.addButton}
                            onClick={() => openPopup(face.name)}
                        >
                            +
                        </button>
                        <button
                            style={styles.deleteButton}
                            onClick={() => deleteFace(face.name)}
                        >
                            🗑
                        </button>
                    </div>
                ))
            ) : (
                <p style={styles.noFacesMessage}>No faces available. Add a new face!</p>
            )}
            <button style={styles.addFaceButton} onClick={() => openPopup(null)}>
                👤+
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
        boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.5)",
    },
    faceName: {
        flexGrow: 1,
        color: "#fff",
        fontSize: "16px",
    },
    faceImage: {
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        objectFit: "cover",
    },
    checkbox: {
        margin: "0 10px",
    },
    addButton: {
        backgroundColor: "#4CAF50",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        padding: "5px 10px",
        cursor: "pointer",
        fontSize: "14px",
    },
    deleteButton: {
        backgroundColor: "#f44336",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        padding: "5px 10px",
        cursor: "pointer",
        fontSize: "14px",
    },
    addFaceButton: {
        marginTop: "10px",
        backgroundColor: "#007BFF",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        padding: "10px 20px",
        cursor: "pointer",
        alignSelf: "center",
        fontSize: "16px",
    },
    noFacesMessage: {
        color: "#aaa",
        textAlign: "center",
        fontStyle: "italic",
    },
};

export default FaceListPage;
