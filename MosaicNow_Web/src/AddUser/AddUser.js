import React, { useState, useEffect, useRef } from "react";
import Top from "../Home/Top";
import { useNavigate } from "react-router-dom";

import "./Adduser.css";

const AddUser = () => {
  const videoElement = useRef(null);
  const canvasElement = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [resultImageUrl, setResultImageUrl] = useState("");
  const timerIdRef = useRef(null); // setTimeout의 ID를 저장하기 위한 ref
  const [videoVisible, setVideoVisible] = useState(true); // 비디오 보이는지 안보이는지

  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoElement.current) videoElement.current.srcObject = stream;
          setStreamActive(true);
          setFrameCount(0);
          captureFrameLoop_add();
        })
        .catch((error) => console.error(error));
    }
  }, []);

  useEffect(() => {
    console.log(frameCount);
    // frameCount가 변경될 때마다 이를 확인하고 필요에 따라 멈춥니다.
    if (frameCount > 50) {
      stopCapture();
    }
  }, [frameCount]);

  useEffect(() => {
    // streamActive 상태가 false가 되면 예약된 모든 setTimeout 호출을 취소
    return () => {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
      }
    };
  }, [streamActive]);

  const add_face = () => {
    setVideoVisible(false);
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoElement.current) videoElement.current.srcObject = stream;
        setStreamActive(true);
        setFrameCount(0);
        captureFrameLoop_add();
      })
      .catch((error) => console.error(error));
  };

  const captureFrameLoop_add = () => {
    if (!streamActive) return;

    if (canvasElement.current && videoElement.current) {
      const context = canvasElement.current.getContext("2d");
      context.drawImage(
        videoElement.current,
        0,
        0,
        canvasElement.current.width,
        canvasElement.current.height
      );
      canvasElement.current.toBlob((blob) => {
        sendFrame_add(blob);
        setFrameCount((prevCount) => prevCount + 1);
      }, "image/jpeg");

      // setTimeout을 설정하고, 반환된 ID를 timerIdRef에 저장
      timerIdRef.current = setTimeout(captureFrameLoop_add, 100);
    }
  };

  const sendFrame_add = (blob) => {
    let formData = new FormData();
    formData.append("user_id", 1);
    formData.append("frame", blob, "frame.jpg");
    fetch("http://110.9.11.9:5000/add_face", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.blob())
      .then((blob) => {
        setResultImageUrl(URL.createObjectURL(blob));
      })
      .catch((error) => console.error("Error:", error));
  };

  const stopCapture = () => {
    navigate("/home");
    if (
      streamActive &&
      videoElement.current &&
      videoElement.current.srcObject
    ) {
      const tracks = videoElement.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      setStreamActive(false);
      videoElement.current.srcObject = null;
      console.log("Streaming and capturing stopped.");
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
      }
    }
  };

  return (
    <div className="all_contents">
      <div className="Top">
        <Top />
      </div>
      <div className="title_and_startbutton">
        <h1 className="title">정면을 바라봐 주세요</h1>
      </div>
      <div className="background">
        <video
          ref={videoElement}
          autoPlay={true}
          width="640"
          height="480"
          style={{ display: videoVisible ? "block" : "none" }} // 비디오 가시성을 조건적으로 적용
        ></video>
        <canvas
          ref={canvasElement}
          width="640"
          height="480"
          style={{ display: "none" }}
        ></canvas>
        <img
          src={resultImageUrl}
          alt="Processed Image"
          style={{
            maxWidth: "640px",
            display: resultImageUrl ? "block" : "none",
          }}
        />
      </div>
      {/* 필요한 경우 여기에 추가 버튼을 구현합니다. */}
      <button className="add_button" onClick={add_face}style={{
                    fontSize: "20px",
                    fontFamily: '"Do Hyeon", sans-serif',
                    color: "white",
                  }}>
        얼굴 등록
      </button>
    </div>
  );
};

export default AddUser;
