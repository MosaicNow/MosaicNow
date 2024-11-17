// src/contexts/FaceContext.js

import React, { createContext, useState, useContext } from "react";

const FaceContext = createContext();

export const FaceProvider = ({ children }) => {
    const [faceList, setFaceList] = useState([]);
    const [selectedFaces, setSelectedFaces] = useState([]);

    return (
        <FaceContext.Provider value={{ faceList, setFaceList, selectedFaces, setSelectedFaces }}>
            {children}
        </FaceContext.Provider>
    );
};

// Custom hook for using FaceContext
export const useFaceContext = () => {
    const context = useContext(FaceContext);
    if (!context) {
        throw new Error("useFaceContext must be used within a FaceProvider");
    }
    return context;
};

export default FaceContext;
