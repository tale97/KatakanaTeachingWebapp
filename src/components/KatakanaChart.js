import React from "react";
import LoadingPopup from "./LoadingPopup";
import { GETCHARSCORE_URL } from "../constants";
import { limitedKatakanaList } from "../jap-char";
import KatakanaChar from "./KatakanaChar";
import { Grid } from "@material-ui/core";
import "../scss/components/KatakanaChar.scss";

class KatakanaChart extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = () => {
    this.props.requestGetCharScore();
  }

  render() {
    var katakanaArray = null;
    var kana_filteredResultList = null;
    var charResultList = this.props.charResultList;

    if (Object.keys(charResultList).length === 0) {
      // return <LoadingPopup isOpen={true} />
      // if haven't receive data
      katakanaArray = limitedKatakanaList.map((kana, idx) => {
        return (
          <Grid item key={idx}>
            <KatakanaChar
              char={kana}
              key={idx}
              isEncountered={false}
              isLoading={true}
            />
          </Grid>
        );
      });
    } else {
      console.log(`DEBUG 二 ${JSON.stringify(charResultList["二"])}`)
      katakanaArray = limitedKatakanaList.map((kana, idx) => {
        kana_filteredResultList = charResultList[kana].filter(resultType => resultType !== "incorrect")
        console.log(`${kana}: ${kana_filteredResultList}`);
        return (
          <Grid item key={idx}>
            <KatakanaChar
              char={kana}
              key={idx}
              isEncountered={kana_filteredResultList.length > 0}
              isLoading={false}
            />
          </Grid>
        );
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
          {katakanaArray}
        </Grid>
      </div>
    );
  };

}

export default KatakanaChart;