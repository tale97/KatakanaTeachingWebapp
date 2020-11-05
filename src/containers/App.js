import React, { Component } from "react";
import { connect } from "react-redux";
import CharList from "./CharList";
import CharInput from "./CharInput";
import NavBar from "../components/NavBar";
import Hint from "../components/Hint";
import { 
  Grid, 
  Paper,
  Switch,
  Box,
  FormControlLabel,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@material-ui/core";
import Signin from "../components/Signin";
import Register from "../components/Register";
import WordCard from "../components/WordCard";
import OutsideAlerter from "../components/OutsideAlerter";
import Footer from "../components/Footer";
import MessageBar from "../components/MessageBar";
import SmallCharList from "../components/SmallCharList";
import KatakanaChart from "../components/KatakanaChart";
import LoadingPopup from "../components/LoadingPopup"
import LinearDeterminate from "../components/LinearDeterminate";
import CircularIndeterminate from "../components/CircularIndeterminate";
import "../scss/containers/App.scss";
import { katakanaToRomaji } from "../jap-char";
import {
  updateChar,
  updateWord,
  resetStore,
  loadUserToStore,
} from "../actions";
import {
  USER_TIME_LIMIT_IN_MINUTES,
  GETCHARSCORE_URL,
} from "../constants";
import {
  listOfPraises,
  listOfSoftPraises,
  Introduction,
} from "../constants/App-constants";
import {
  parseJapaneseWord,
  requestModuleInfo,
  moveToNextWord,
  requestNewWord,
  updateScoreThenGetModule,
} from "../constants/App-methods";
import LogRocket from "logrocket";
import 'intro.js/introjs.css';
import { Steps } from 'intro.js-react';

LogRocket.init("zskhtw/japanese-learning");

const mapStateToProps = (state) => {
  return {
    currentJapChar: state.changeCardState.currentJapChar,
    onIncorrectCard: state.changeCardState.onIncorrectCard,
    curWrongChar: state.changeCardState.curWrongChar,
    onHintedCard: state.changeCardState.onHintedCard,
    wordCompleted: state.changeCardState.wordCompleted,
    currentWord: state.changeCardState.currentWord,
    audioIsPlaying: state.changeGeneralState.audioIsPlaying,
    romajiNotInDict: state.changeInputBox.romajiNotInDict,
    cardStateList: state.changeCardState.cardStateList,
    indexCurrentCard: state.changeCardState.indexCurrentCard,
    wrongCharList: state.changeCardState.wrongCharList,
    romajiList: state.changeCardState.romajiList,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setCurrentChar: (japchar, romaji) => {
      dispatch(updateChar(japchar, romaji));
    },
    updateWord: (word, romajiList) => {
      dispatch(updateWord(word, romajiList));
    },
    resetStore: () => {
      dispatch(resetStore());
    },
    loadUserToStore: (userInfo) => {
      dispatch(loadUserToStore(userInfo));
    },
  };
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      route: "register", // should be register
      // userInfo: {
      //   email: "developer@g.com",
      //   joined: "2020-10-26T14:19:40.915Z",
      //   name: "Developer",
      //   id: "5ab535f5-b0eb-4a9b-98b5-b6b86cd8d328",
      // },
      userInfo: {
        id: "",
        name: "",
        email: "",
        joined: "",
      },
      requestedWord: null,
      charResultList: {},
      isFetchingCharResult: false,

      currentWordInfo: null,
      openEndDialogue: false,
      isFetchingWord: false,
      checkedAudioAutoPlay: false,
      checkedEnableMessage: true,
      walkThroughEnabled: false,

      // introjs test
      initialStep: 0,
      introductory_steps: Introduction,
      disableAllAction: false,
      firstTimeCompleteWordSinceWalkThru: false,
      firstIntroductionEnabled: false,
      moduleInfo: null,
      randomIndex: 0,
    };
    this.charInputRef = React.createRef();
    this.hintCardRef = React.createRef();
    this.wordCardRef = React.createRef();
  }

  componentDidMount = () => {
    this.props.resetStore();
    this.requestAndUpdateWord();
    this.requestModuleInfo(this);
  }

  componentDidUpdate = (prevProps, prevState) => {
    // check if it's user's first time logging in
    if (this.state.route === "home"
        && prevState.route === "register") {
      this.setState({ walkThroughEnabled: false }) // TODO should be true, if want to enable by default when login first time
      this.setState({ firstIntroductionEnabled: true });
      this.setState({ requestNewWord: null });
      this.requestModuleInfo(this);
    } 
    if (this.state.userInfo.id !== prevState.userInfo.id) {
      this.props.resetStore();
      this.requestAndUpdateWord();
      this.requestModuleInfo(this);
    }
    if (this.props.wordCompleted 
        && this.props.wordCompleted !== prevProps.wordCompleted) {
      this.requestNewWord(this);
    }
    if (this.state.route === "home") {
      setTimeout(() => {
        this.setState({ openEndDialogue: true });
      }, USER_TIME_LIMIT_IN_MINUTES * 60000);
    }
    if (this.state.requestedWord !== prevState.requestedWord) {
      this.setState({ randomIndex: Math.floor(Math.random() * 8) })
    }
    // if (this.state.route === "home" 
    //   && (prevState.route === "register" || prevState.route === "login")) {
    //   this.setState({ requestNewWord: null });
    // }
  };

  loadUser = (user) => {
    const { user_uid, name, email, joined } = user;
    this.setState((prevState) => {
      let userInfo = { ...prevState.userInfo };
      userInfo.name = name;
      userInfo.id = user_uid;
      userInfo.email = email;
      userInfo.joined = joined;
      return { userInfo };
    });
    this.props.loadUserToStore(user);
    LogRocket.identify(user_uid, {
      name: name,
      email: email,
      joined: joined,
    });
    console.log("userInfo", this.state.userInfo);
  };

  onRouteChange = (route) => {
    this.setState({ route: route });
  };
  requestModuleInfo = requestModuleInfo;
  requestNewWord = requestNewWord;
  moveToNextWord = moveToNextWord;
  updateScoreThenGetModule = updateScoreThenGetModule;

  requestAndUpdateWord = async () => {
    await this.requestNewWord(this);
    this.moveToNextWord(this.state.requestedWord, this);
  };

  requestGetCharScore = () => {
    this.setState({ isFetchingCharResult: true });
    fetch(GETCHARSCORE_URL, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_uid: this.state.userInfo.id,
      }),
    })
    .then((res) => res.json())
    .then((charResultList) => {
      this.setState({ isFetchingCharResult: false });
      this.setState({ charResultList: charResultList });
    })
    .catch((err) => {
      console.log("Error in getting characters' familiarity", err);
    });
  };

  focusInputBox = () => {
    this.charInputRef.current.formRef.current.focus();
  };

  onClickCard = (event) => {
    const kana_char = event.target.innerText;
    this.setState({ clickedJapChar: kana_char });
    // unclick
    if (this.state.clickedJapChar === kana_char) {
      this.setState({ clickedJapChar: "" });
    }
  };

  showHint = () => {
    // once user completed word, can review hint card
    if (this.props.wordCompleted && this.state.clickedJapChar) {
      return (
        <Grid item>
          <Paper elevation={1} />
          <Hint 
            currentHintedChar={this.state.clickedJapChar} 
            autoplayAudio={this.state.checkedAudioAutoPlay}
            ref={this.hintCardRef}
          />
        </Grid>
      );
    }
    if (this.props.onHintedCard) {
      return (
        <Grid item>
          <Paper elevation={1} />
          <Hint 
            currentHintedChar={this.props.currentJapChar} 
            autoplayAudio={this.state.checkedAudioAutoPlay}
            ref={this.hintCardRef}
          />
        </Grid>
      );
    }
  };

  displayWordInfo = () => {
    if (this.props.wordCompleted && this.props.version === 1) {
      return (
        <Grid item>
          <WordCard
            wordInfo={this.state.currentWordInfo}
            word_audio_duration={this.state.word_audio_duration}
            autoplayAudio={this.state.checkedAudioAutoPlay}
            ref={this.wordCardRef}
          />
        </Grid>
      );
    } else {
      return null;
    }
  };

  getKeyByValue = (object, value) => {
    return Object.keys(object).find((key) => object[key] === value);
  };

  randomItem = (aList) => {
    return aList[Math.floor(Math.random() * aList.length)];
  };

  displayMessage = () => {
    const {
      onIncorrectCard,
      onHintedCard,
      curWrongChar,
      wordCompleted,
      audioIsPlaying,
      romajiNotInDict,
      currentJapChar,
      cardStateList,
      indexCurrentCard,
      wrongCharList,
      romajiList,
      currentWord,
    } = this.props;
    if (this.state.isFetchingCharResult
        || !this.state.requestedWord
        && !parseJapaneseWord(currentWord).length <= 0) {
      return <CircularIndeterminate isOpen={true}/>
    } else if (parseJapaneseWord(currentWord).length <= 0) {
      return <LoadingPopup isOpen={true}/>
    }
    if (this.state.route === "progress") {
      return `
        You can click on each card to see how many times you've gotten a character correct (green) vs how many times you've used hint (yellow).
      `;
    }
    if (this.state.route === "katakanaChart") {
      return `
        Hover over each card to see its pronunciation! Characters you've already seen are highlighted in color.
      `;
    }
    if (this.state.walkThroughEnabled) {
      return "..."
    }
    if (audioIsPlaying) {
      return `Playing audio...`;
    }
    if (onIncorrectCard) {
      return (romajiNotInDict 
        ? `${curWrongChar} does not exist in the Japanese alphabet. Delete your input and try again.`
        : `${curWrongChar} corresponds to ${this.getKeyByValue(katakanaToRomaji, curWrongChar)}, not ${currentJapChar}. Delete your input and try again.`
      );
    } else if (onHintedCard) {
      return "Type the character. You can also click on the card for audio."
    } else if (romajiList[indexCurrentCard] in wrongCharList) {
      return "Type the character if you know it, or press spacebar if you're stuck."
    } else if (indexCurrentCard > 0 
      && indexCurrentCard < cardStateList.length
      && cardStateList[indexCurrentCard - 1] === "correct") {
        return listOfSoftPraises[0];
    } else if (wordCompleted && !audioIsPlaying) {
      const cardStateSet = new Set(cardStateList);
      if (cardStateSet.size === 1 && cardStateSet.has("correct")) {
        return `${listOfPraises[0]} Press spacebar to continue.`;
      } else {
        return `Click on ${this.props.version === 1 ? 'a' : 'the'} character or press spacebar to continue.`;
      }
    } else {
      // return `I will be giving you feedback as you use the app.`;
      return `Press spacebar if you're stuck.`;
    }
  };
  setButtonText = () => {
    const {
      onIncorrectCard,
      onHintedCard,
      wordCompleted,
      audioIsPlaying,
      currentJapChar,
    } = this.props;

    if (onIncorrectCard) {
      return "Try Again";
    } else if (onHintedCard && !audioIsPlaying) {
      return "Got it";
    } else if (wordCompleted && !audioIsPlaying) {
      return "Next Word";
    } else if (!onHintedCard && !wordCompleted) {
      return `LEARN ${currentJapChar}`;
    } else {
      return "";
    }
  };
  displayLoadingPopup = () => {
    setTimeout(() => {
      return this.state.isFetchingWord;
    }, 1000);
  } // not used

  handleAudioAutoplaySwitch = (event) => {
    this.setState(
      { checkedAudioAutoPlay: !this.state.checkedAudioAutoPlay }
    );
  }
  handleEnableMessageSwitch = () => {
    this.setState(
      { checkedEnableMessage: !this.state.checkedEnableMessage }
    );
  }

  onExitIntroduction = () => {
    this.setState({ firstIntroductionEnabled: false });
  }

  endWalkThrough = () => {
    this.clearFormInput(this.charInputRef.current.formRef.current);
    this.setState({ walkThroughEnabled: false });
    this.props.resetStore();
    this.requestAndUpdateWord();
  }

  firstTimeCompleteWordSinceWalkThrough = () => {
    this.setState({ firstTimeCompleteWordSinceWalkThru : true })
  }
  
  renderRoute = (route) => {
    switch (route) {
      case "progress":
        return (
          <div className="progress-flex-container">
            <div className="progress-flex-item1">
              <NavBar
                onRouteChange={this.onRouteChange}
                currentTab="progress"
              />
            </div>
            <div>
              <MessageBar 
                className={`message-box`}
                userName={"friend."}
                message={this.displayMessage()}
                displayHelpMessages={true}
              />
            </div>
            <div className="progress-flex-item2">
              <SmallCharList 
                requestGetCharScore={this.requestGetCharScore}
                charResultList={this.state.charResultList}
              />
            </div>
            <Footer />
          </div>
        );
      case "katakanaChart":
        return (
          <div className="progress-flex-container">
            <div className="progress-flex-item1">
              <NavBar
                onRouteChange={this.onRouteChange}
                currentTab="katakanaChart"
              />
            </div>
            <div>
              <MessageBar 
                className={`message-box`}
                userName={"friend."}
                message={this.displayMessage()}
                displayHelpMessages={true}  
              />
            </div>
            <div className="progress-flex-item2">
              <KatakanaChart 
                requestGetCharScore={this.requestGetCharScore}
                charResultList={this.state.charResultList}
              />
            </div>
            <Footer />
          </div>
        )
      case "signin":
        return (
          <Signin onRouteChange={this.onRouteChange} loadUser={this.loadUser} />
        );
      case "register":
        return (
          <Register
            onRouteChange={this.onRouteChange}
            loadUser={this.loadUser}
          />
        );
      case "home":
        const { currentWord } = this.props;
        const { initialStep } = this.state;
        const generalStepsOptions = {
          showStepNumbers: false,
          hidePrev: true,
          hideNext: true,
          exitOnOverlayClick: false,
          exitOnEsc: false,
          showButtons: true,
          overlayOpacity: 0.5,
          skipLabel: "Skip",
          doneLabel: "Start Learning",
        };
        return (
          <div className="page-container" style={{ position: "relative" }}>
            <LoadingPopup isOpen={this.displayLoadingPopup()}/>
            <Steps
              enabled={this.state.firstIntroductionEnabled}
              steps={this.state.introductory_steps}
              initialStep={initialStep}
              onExit={this.onExitIntroduction}
              options={generalStepsOptions}
              ref={steps => (this.introductory_steps = steps)}
            >
            </Steps>
            <Dialog
              open={this.state.openEndDialogue}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">
                {`Time's Up! You've reached level ${this.state.moduleInfo.moduleIndex}!`}
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  <p>
                    {`You have used the app for ${USER_TIME_LIMIT_IN_MINUTES} minutes. Please click the link
                    below to take a short test that will assess your Katakana
                    knowledge. Thank you so much for using the app, ${this.state.userInfo.name}! If you want you can add me on Facebook (Le Trung Tuan Anh) and give me feedback on the app. I would love to hear from you!`}
                  </p>
                  <a
                    href="https://harvard.az1.qualtrics.com/jfe/form/SV_2aZI7SwLfhp5nxj"
                    className="survey-link"
                  >
                    {"https://harvard.az1.qualtrics.com/jfe/form/SV_2aZI7SwLfhp5nxj"}
                  </a>
                </DialogContentText>
              </DialogContent>
            </Dialog>
            <div className="content-wrap">
              <NavBar 
                onRouteChange={this.onRouteChange} 
                currentTab="home"
              />
              <div className="message-bar">
                <MessageBar 
                  userName={this.state.userInfo.name}
                  message={this.displayMessage()}
                  displayHelpMessages={this.state.checkedEnableMessage}
                />
              </div>
              <FormControlLabel
                className="audio-control switch-control"
                label="Autoplay Audio"
                labelPlacement="start"
                control={
                  <Switch 
                    // disabled
                    checked={this.state.checkedAudioAutoPlay}
                    onChange={this.handleAudioAutoplaySwitch}
                    name="autoplay-audio" 
                    color="primary"
                  />
                }
              >
              </FormControlLabel>
              <FormControlLabel
                className="message-control switch-control"
                label="Help Message"
                labelPlacement="start"
                control={
                  <Switch 
                    checked={this.state.checkedEnableMessage}
                    onChange={this.handleEnableMessageSwitch}
                    name="enable-message" 
                    color="primary"
                  />
                }
              >
              </FormControlLabel>
              <Grid
                container
                direction="column"
                justify="center"
                alignItems="center"
              >
                <div className="main-area">
                  <div className="inputbox-and-word"
                  >
                    <Grid item className="inputbox-div">
                      <OutsideAlerter focusInputBox={this.focusInputBox}>
                        <CharInput
                          getKeyByValue={this.getKeyByValue}
                          user_uid={this.state.userInfo.id}
                          ref={this.charInputRef}
                          setClick={(click) => (this.clickChild = click)}
                          matchClearFormInputFunction={(childFunc) => (this.clearFormInput = childFunc)}
                          disableAllAction={this.state.disableAllAction}
                          endWalkThrough={this.endWalkThrough}
                          walkThroughEnabled={this.state.walkThroughEnabled}
                          moveToNextWord = {this.moveToNextWord}
                          requestedWord = {this.state.requestedWord}
                          firstTimeCompleteWordSinceWalkThrough = 
                          {this.firstTimeCompleteWordSinceWalkThrough}
                          requestModuleInfo={this.requestModuleInfo}
                          updateScoreThenGetModule={this.updateScoreThenGetModule}
                          thisApp={this}
                        />
                      </OutsideAlerter>
                    </Grid>
                    <Grid item className="japanese-word-area">
                      <CharList
                        charsToRead={parseJapaneseWord(currentWord)}
                        onClickCard={this.onClickCard}
                        clickedJapChar={this.state.clickedJapChar}
                      />
                    </Grid>

                    {this.state.requestedWord ? (
                      <div>
                        <div className="module-level">
                          {`Level ${this.state.moduleInfo ? this.state.moduleInfo.moduleIndex : 0}`}
                        </div>
                        <Grid item>
                          <Box
                            className="progress-bar"
                          >
                            <LinearDeterminate 
                              moduleInfo={this.state.moduleInfo} 
                            />
                          </Box>
                        </Grid>
                      </div>
                    ) : (
                      null
                    )}


                  </div>
                  <Grid item className="card-area">
                    <Grid
                      container
                      direction="row"
                      justify="center"
                      alignItems="center"
                      spacing={2}
                    >                      
                      {this.showHint()}
                      {this.displayWordInfo()}
                    </Grid>                  
                  </Grid>
                </div>
              </Grid>
            </div>
            <Footer />
          </div>
        );
      default:
        return <div>Default</div>;
    }
  };

  render() {
    return <div className="tc">{this.renderRoute(this.state.route)}</div>;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
