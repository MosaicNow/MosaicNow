import React from "react";
import { Link } from "react-router-dom"; // Link 컴포넌트를 임포트합니다.
import "./Top.css";
import HomeImage from "./img/Home.png";

function Top() {
  return (
    <div className="Top">
      <div className="top-left"></div>
      <nav>
        <ul>
          <li>
            <Link to="/home" className="homeButton">
              <img src={HomeImage} alt="Home" />
            </Link>
          </li>
        </ul>
      </nav>
      <div className="top-right"> </div>
    </div>
  );

  /*return (
        
        <div className='Top'>
            <div cl assName='top-left'></div>
            <div className='top-center'><Link to="http://localhost:3000/" className="homeButton"><strong>HOME</strong></Link></div>
            <div className='top-right'></div>
        </div>
    );*/
}

export default Top;
