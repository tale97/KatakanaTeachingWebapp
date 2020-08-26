import React from "react";
import { Paper } from "@material-ui/core";
import "../scss/components/WelcomeBar.scss";

const WelcomeBar = ({ userName }) => {
  return (
    <div
      className="tmw5 center bg-white br3 pa1 ma1 ba b--black-10 tl"
      style={{ color: "#5D5D5D" }}
    >
      <Paper elevation={0} />
      <div className="welcome-text">
        <p>Welcome, {userName}! </p>
        <ul>
          <li>Press SPACE to learn the character in the highlighted card</li>
          <li>
            Type the character as fast as you can if you've already known the
            character
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WelcomeBar;
