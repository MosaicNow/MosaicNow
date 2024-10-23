// ImageContextProvider.js
import React, { useState } from "react";
import ImageContext from "./ImageContext";

const ImageContextProvider = ({ children }) => {
  const [resultImageUrl, setResultImageUrl] = useState("");

  return (
    <ImageContext.Provider value={{ resultImageUrl, setResultImageUrl }}>
      {children}
    </ImageContext.Provider>
  );
};

export default ImageContextProvider;
