import React, { useState, useEffect } from "react";
import Top from "../Home/Top";
import "./Setup_ChangeStreamKey.css";
import usericon from "../Home/img/user_icon.png";
import { Link, useNavigate } from "react-router-dom";

function Setup_ChangeSK() {
  const [userID, setUserID] = useState("");
  const [streamkey, setSK] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // 페이지 로드 시 실행되는 함수
    const userIDFromCookie = getCookie("userID");
    setUserID(userIDFromCookie);
  }, []);

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  function changeSK() {
    // 쿠키에서 사용자 ID를 가져옵니다.
    const id = getCookie("userID");

    // 사용자 ID가 없으면 알림을 표시하고 함수를 종료합니다.
    if (!id) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 만약 입력된 비밀번호가 없다면 알림을 표시하고 함수를 종료합니다.
    if (!streamkey) {
      alert("새 비밀번호를 입력하세요.");
      return;
    }

    const data = { id: userID, sk: streamkey };

    fetch("http://110.9.11.9:8000/changeSK", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.status === 200) {
          alert("스트림키가 변경/등록되었습니다.");
          navigate("/home");
        } else if (response.status === 500) {
          alert("다시 시도해주세요");
        } else {
          throw new Error("Something went wrong on the server");
        }
      })
      .catch((error) => {
        console.error("Error occurred:", error);
        alert("Error occurred. Please try again.");
      });
  }

  return (
    <div className="Setup_Page" style={{ height: "100%" }}>
      <div className="Top">
        <Top />
      </div>

      <div className="SetupPage_info">
        <div className="back">
          <div className="usericon_setup">
            <img className="user_icon_" src={usericon} alt="User Icon" />
          </div>
          <p className="id_text">
            <span>{userID}</span>
          </p>
          <div className="input_and_check">
            <div className="input_place_box">
              <input
                style={{
                  fontFamily: '"Do Hyeon", sans-serif',
                  color: "#cdcdcd",
                }}
                type="streamkey"
                id="input_place"
                className="input_place_stk"
                placeholder="새 스트림키 입력"
                value={streamkey}
                onChange={(e) => setSK(e.target.value)}
              />
            </div>

            <button
              className="gOHome_"
              onClick={changeSK}
              style={{
                fontSize: "20px",
                fontFamily: '"Do Hyeon", sans-serif',
                color: "white",
              }}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Setup_ChangeSK;
