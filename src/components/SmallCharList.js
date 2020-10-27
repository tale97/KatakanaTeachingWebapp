import React from "react";
import SmallChar from "../components/SmallChar.js";
import { Grid } from "@material-ui/core";
import { limitedKatakanaList } from "../jap-char";
import "../scss/components/SmallChar.scss";

class SmallCharList extends React.Component {
  componentDidMount = () => {
    this.props.requestGetCharScore();
  };

  computeCorrectNum = (resultList) => {
    return resultList.length === 0
      ? 0
      : resultList.reduce((acc, item) => {
          if (item === "correct") {
            acc += 1;
          }
          return acc;
        }, 0);
  };

  computeIncorrectNum = (resultList) => {
    return resultList.length === 0
      ? 0
      : resultList.reduce((acc, val) => {
          if (val === "incorrect") {
            acc += 1;
          }
          return acc;
        }, 0);
  };

  render() {
    var charsArrayDisplay = null;
    var charResultList = this.props.charResultList;

    if (Object.keys(this.props.charResultList).length === 0) {
      charsArrayDisplay = limitedKatakanaList.map((kana, idx) => {
          return (
            <Grid item key={idx}>
              <SmallChar
                char={kana}
                key={idx}
                hintedPercent={0}
                correctPercent={0}
                correctNum={0}
                hintedNum={0}
                isLoading={true}
              />
            </Grid>
          ); 
      });
    } else {
      charsArrayDisplay = limitedKatakanaList.map((kana, idx) => {
        if (kana !== "clearBuffer") {
          var resultList = charResultList[kana]
          var correctNum = this.computeCorrectNum(resultList);
          var incorrectNum = this.computeIncorrectNum(resultList);
          var hintedNum = resultList.length - correctNum - incorrectNum;
          return (
            <Grid item key={idx}>
              <SmallChar
                char={kana}
                key={idx}
                correctNum={correctNum}
                hintedNum={hintedNum}
                isLoading={false}
              />
            </Grid>
          );
        } else {
          return null;
        }
      });
    }

    return (
      <div className="characters-list">
        <Grid
          container
          direction="row"
          justify="center"
          alignItems="center"
          spacing="2"
        >
          {charsArrayDisplay}
        </Grid>
      </div>
    );
  }
}

export default SmallCharList;
