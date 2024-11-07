import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Login_Join.css";

function Join() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const navigate = useNavigate();

  function submitForm() {
    if (!id || !pw) {
      alert("ID와 PW를 모두 입력하세요.");
      return;
    }

    const data = { id, pw };

    fetch("http://110.9.11.9:8000/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.status === 200) {
          navigate("/");
        } else if (response.status === 401) {
          alert("다시 시도해주세요!!");
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
    <div className="Login_Join_all">
      <div className="Join-background">
        <div className="join-input-idpw">
          <div className="signup">Sign up</div>
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
              type="password"
              className="input_place_tohome_PW"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </div>
        </div>
        <button
          className="join_check_to_home"
          onClick={submitForm}
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
  );
}

export default Join;
