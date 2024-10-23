import React, { useState, useEffect } from "react";
import Top from "../Home/Top";
import "./Setup.css";
import usericon from "../Home/img/user_icon.png";
import { Link, useNavigate } from "react-router-dom";

function Setup(props) {
  const navigate = useNavigate();
  const [userID, setUserID] = useState("");
  const [password, setPassword] = useState("");

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

  function submitForm() {
    const id = getCookie("userID");
    if (!id) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!password) {
      alert("비밀번호를 입력하세요.");
      return;
    }

    const data = { id: userID, pw: password };

    fetch("http://110.9.11.9:8000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.status === 200) {
          props.toggleView();
        } else if (response.status === 401) {
          alert("비밀번호가 잘못되었습니다. 다시 시도해주세요!!");
        } else {
          throw new Error("서버에서 오류가 발생했습니다.");
        }
      })
      .catch((error) => {
        console.error("오류가 발생했습니다:", error);
        alert("오류가 발생했습니다. 다시 시도하세요.");
      });
  }
  return (
    <div className="SetupPage" style={{ height: "100%" }}>
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
            <div>
              <div className="PW-txt">PW</div>
              <div className="pw_check">
                <div className="input_place_PW">
                  <input
                    style={{ fontFamily: '"Do Hyeon", sans-serif' }}
                    type="password"
                    className="input-place-check-pw"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} // 입력란의 값이 변경될 때마다 상태를 업데이트
                  />
                </div>
              </div>
            </div>

            <button
              onClick={submitForm}
              className="check"
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

function Setup_2ndStep() {
  const [userID, setUserID] = useState("");

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

  return (
    <div className="SetupPage" style={{ height: "100%" }}>
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
            <div className="Change_info">
              <Link to="/setup_stk">
                <button
                  className="check"
                  style={{
                    fontSize: "20px",
                    fontFamily: '"Do Hyeon", sans-serif',
                    color: "white",
                  }}
                >
                  스트림키 변경
                </button>
              </Link>
              <Link to="/setup_pw">
                <button
                  className="check"
                  style={{
                    fontSize: "20px",
                    fontFamily: '"Do Hyeon", sans-serif',
                    color: "white",
                  }}
                >
                  비밀번호 변경
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewChange() {
  const [viewNext, setViewNext] = useState(false);

  const toggleView = () => {
    setViewNext(!viewNext);
  };

  return (
    <div>
      {viewNext ? <Setup_2ndStep /> : <Setup toggleView={toggleView} />}
    </div>
  );
}

export default ViewChange;
