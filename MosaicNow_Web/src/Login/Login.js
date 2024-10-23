import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./Login_Join.css";

function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const navigate = useNavigate();

  const submitForm = () => {
    if (!id || !pw) {
      alert("ID와 PW를 모두 입력하세요.");
      return;
    }

    const data = { id, pw };

    fetch("http://110.9.11.9:8000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.status === 200) {
          response.json().then((data) => {
            const { userNum, userID } = data;
            document.cookie = `userID=${userID}; path=/`;
            document.cookie = `userNum=${userNum}; path=/`;
            navigate("/home");
          });
        } else if (response.status === 401) {
          alert("ID 또는 비밀번호가 올바르지 않습니다.");
        } else if (response.status === 500) {
          throw new Error("Internal Server Error");
        } else {
          throw new Error("Something went wrong on the server");
        }
      })
      .catch((error) => {
        console.error("Error occurred:", error);
        alert("Error occurred. Please try again.");
      });
  };

  return (
    <div className="Login_Join_all">
      <div className="Login-background">
        <div className="input-idpw">
          <div className="login-to-account">Login to your account</div>
          <div className="id_to_home">
            <div className="idt">ID</div>
            <input
              type="text"
              className="input_place_tohome"
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
          </div>
          <div>
            <div className="pwt">PW</div>
            <input
              type="text"
              className="input_place_tohome_PW"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </div>
        </div>
        <div className="buttons_box">
          <button
            className="check_to_home"
            onClick={submitForm}
            style={{
              fontSize: "20px",
              fontFamily: '"Do Hyeon", sans-serif',
              color: "white",
            }}
          >
            확인
          </button>
          <Link to="/Join">
            <button
              className="check_to_join"
              style={{
                fontSize: "20px",
                fontFamily: '"Do Hyeon", sans-serif',
                color: "white",
              }}
            >
              회원가입
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
