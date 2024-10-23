import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import "./App.css";
import HomePage from "./HomePage";
import Setup from "../Setup/Setup";
import Adduser from "../AddUser/AddUser";
import Setup_ChangeStreamKey from "../Setup/Setup_ChangeStreamKey";
import Setup_ChangePW from "../Setup/Setup_ChangePW";
import ImageContextProvider from "../ImageContext/ImageContextProvider";
import WebcamStreamCapture from "../AddUser/AddUser";

import Login from "../Login/Login";
import Join from "../Login/Join";

function App() {
  return (
    <ImageContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/join" element={<Join />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/adduser" element={<Adduser />} />
          <Route path="/setup_stk" element={<Setup_ChangeStreamKey />} />
          <Route path="/setup_pw" element={<Setup_ChangePW />} />
        </Routes>
      </Router>
    </ImageContextProvider>
  );
}
/*function App() {
  return (
    <Router>
    <div className="App">

      <div className='Top'>
        <Top />
        
      </div>

    <div className="ContentWrapper">
      
      <ContentArea />
      
      <UserInfoPanel />

    </div>
  </div>
  </Router>
  );
}*/

export default App;
