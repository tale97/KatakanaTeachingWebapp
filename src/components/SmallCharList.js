import React from "react";
import SmallChar from "../components/SmallChar.js";
import { Grid } from "@material-ui/core";
import { katakanaToRomaji, limitedKatakanaList } from "../jap-char";
import { GETCHARSCORE_URL } from "../constants";
import "../scss/components/SmallChar.scss";
import LoadingPopup from "./LoadingPopup";
import MessageBar from "../components/MessageBar";


class SmallCharList extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = () => {
    this.props.requestGetCharScore();
  };

  computeCorrectPercentage = (resultList) => {
    var total_correct = 0;
    var correctAndHintedNum = resultList.reduce((acc, item) => {
      if (item !== "incorrect") {
        acc += 1;
      }
      return acc;
    }, 0);
    if (correctAndHintedNum === 0) {
      return -1;
    }
    resultList.forEach((result) => {
      if (result === "correct") total_correct += 1;
    });
    return Math.round((total_correct / resultList.length) * 100);
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

  computeHintedNum = (resultList) => {
    return resultList.length === 0
      ? 0
      : resultList.reduce((acc, val) => {
          if (val === "hinted") {
            acc += 1;
          }
          return acc;
        }, 0);
  };

  render() {
    var charsArrayDisplay = null;
    var charResultList = this.props.charResultList;

    if (Object.keys(this.props.charResultList).length === 0) {
      // return <LoadingPopup isOpen={true} />;
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
      console.log(`DEBUG 二 ${JSON.stringify(charResultList["二"])}`)
      charsArrayDisplay = limitedKatakanaList.map((kana, idx) => {
        if (kana !== "clearBuffer") {
          var correctPercentage = 0;
          var hintedPercentage = 0;
          var correctNum = this.computeCorrectNum(
            charResultList[kana]
          );
          var incorrectNum = this.computeIncorrectNum(
            charResultList[kana]
          );
          var hintedNum = charResultList[kana].length - correctNum - incorrectNum;
  
          if (Object.keys(charResultList).length > 0) {
            correctPercentage = this.computeCorrectPercentage(
              charResultList[kana]
            );
            hintedPercentage = 100 - correctPercentage;
            if (correctPercentage === -1) {
              correctPercentage = 0;
              hintedPercentage = 0;
            }
          }
          return (
            <Grid item key={idx}>
              <SmallChar
                char={kana}
                key={idx}
                hintedPercent={hintedPercentage}
                correctPercent={correctPercentage}
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
