import React from "react";
import "../scss/containers/App.scss";
import "../scss/components/Char.scss";
import { VERSION } from "../constants";
import Skeleton from '@material-ui/lab/Skeleton';

class Char extends React.Component {
  render() {
    const className = `card${VERSION === 2 ? `2` : ``} 
      ${this.props.cardState} ${
      this.props.wordCompleted ? "card-button" : ""
    }`;
    return (
      <div className={className} onClick={this.props.onClickCard}>
        <h1 className="char">{this.props.char}</h1>
      </div>
    );
  }
}

export default Char;
