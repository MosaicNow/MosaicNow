/*확인 눌렀을 때 비밀번호 같으면 스트리밍키 입력으로*/

import React from "react";
import Top from "../Home/Top";
import "./Setup.css";
import usericon from "../Home/img/user_icon.png";

function Setup() {
  // 페이지 로드 시 실행되는 함수
  window.onload = function () {
    // 쿠키에서 사용자 ID를 가져와서 id_text 엘리먼트에 적용
    const userID = getCookie("userID");
    document.getElementById("userID").innerText = userID;
  };

  // 쿠키에서 특정 이름의 쿠키 값을 가져오는 함수
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }
  function click_setstk() {
    window.location.href = "setup_stk.html";
  }

  function click_setpw() {
    window.location.href = "setUp_pw";
  }
  return (
    <div className="SetupPage" style={{ height: "100%" }}>
      <div>
        <Top />
      </div>

      <div className="SetupPage_info">
        <div className="back">
          <div className="usericon_setup">
            <img className="user_icon_" src={usericon} alt="User Icon" />
          </div>
          <div>아이디</div>
          <div className="input_and_check">
            <div className="pw_check">
              <button className="Change_StreamKey">스트림키 변경</button>
              <button className="Change_PW">비밀번호 변경</button>
            </div>
            <button className="check">확인</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Setup;
