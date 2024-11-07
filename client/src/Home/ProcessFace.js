import React, { useState } from "react";

function ProcessFace() {
  const [processedImageUrl, setProcessedImageUrl] = useState("");

  const sendFrame_process = (blob) => {
    let formData = new FormData();
    formData.append("user_id", "1");
    formData.append("selected_user_ids[]", 1);
    formData.append("frame", blob, "frame.jpg");
    fetch("http://127.0.0.1:5000/process_face", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.blob())
      .then((blob) => {
        // 상태를 사용하여 처리된 이미지의 URL을 업데이트
        setProcessedImageUrl(URL.createObjectURL(blob));
      })
      .catch((error) => console.error("Error:", error));
  };

  return (
    <div className="ContentArea">
      {processedImageUrl && <img src={processedImageUrl} alt="Processed" />}
    </div>
  );
}

export default ProcessFace;
