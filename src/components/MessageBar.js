import React from "react";
import "../scss/components/MessageBar.scss";
import shortid from "shortid";

const MessageBar = (props) => {
  return (
    <div className="message-box">
      <div className="message">
        {props.displayHelpMessages ? (
          <p key={shortid.generate()}>
            {props.message}
          </p>
        ) : (
          <p>
            {`Welcome, ${props.userName}.`}
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageBar;
