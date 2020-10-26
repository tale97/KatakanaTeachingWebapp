import React, { Component } from "react";
import { connect } from "react-redux";
import CharList from "./CharList";
import CharInput from "./CharInput";
import NavBar from "../components/NavBar";
import Hint from "../components/Hint";
import { 
  Grid, 
  Paper,
  Button,
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
import WordCard2 from "../components/WordCard2";
import OutsideAlerter from "../components/OutsideAlerter";
import Footer from "../components/Footer";
import MessageBar from "../components/MessageBar";
import SmallCharList from "../components/SmallCharList";
import KatakanaChart from "../components/KatakanaChart";
import LoadingPopup from "../components/LoadingPopup"
import LinearDeterminate from "../components/LinearDeterminate";
import "../scss/containers/App.scss";
import { katakanaToRomaji } from "../jap-char";
import {
  updateChar,
  updateWord,
  resetStore,
  loadUserToStore,
} from "../actions";
import {
  GETWORD_URL,
  UPDATECHARSCORE_URL,
  WORDSCORE_URL,
  MEDIA_BASE_URL_WORD,
  USER_TIME_LIMIT_IN_MINUTES,
  GETMODULEINFO_URL,
  GETCHAR_URL,
} from "../constants";
import {
  listOfPraises,
  listOfSoftPraises,
  WALKTHROUGH_PART_1,
  WALKTHROUGH_PART_2,
  WALKTHROUGH_PART_3,
  WALKTHROUGH_PART_4,
  Introduction,
} from "../constants/App-constants";
import {
  parseJapaneseWord,
  updateCharScore,
  parseAudio,
  requestModuleInfo,
  requestNewWordPromise,
  requestNewCharPromise,
  moveToNextWord,
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
      route: "home", // should be register
      userInfo: {
        email: "developer@g.com",
        joined: "2020-10-26T14:19:40.915Z",
        name: "Developer",
        id: "5ab535f5-b0eb-4a9b-98b5-b6b86cd8d328",
      },
      // userInfo: {
      //   id: "",
      //   name: "",
      //   email: "",
      //   joined: "",
      // },
      requestedWord: `place_holder`,

      currentWordInfo: null,
      openEndDialogue: false,
      isFetchingWord: false,
      checkedAudioAutoPlay: false,
      checkedEnableMessage: true,
      checkedEnableBlueButton: false,
      walkThroughEnabled: false,

      // introjs test
      initialStep: 0,
      steps1Enabled: false,
      steps2Enabled: false,
      steps3Enabled: false,
      steps4Enabled: false,
      transitionedFromSteps1ToSteps2: false,
      transitionedFromSteps2ToSteps3: false,
      transitionedFromSteps3ToSteps5: false,
      steps1: WALKTHROUGH_PART_1,
      steps2: WALKTHROUGH_PART_2,
      steps3: WALKTHROUGH_PART_3,
      steps4: WALKTHROUGH_PART_4,
      introductory_steps: Introduction,
      disableAllAction: false,
      firstTimeCompleteWordSinceWalkThru: false,
      firstIntroductionEnabled: false,
      
      moduleInfo: null,
    };
    this.charInputRef = React.createRef();
    this.hintCardRef = React.createRef();
    this.wordCardRef = React.createRef();
  }

  componentDidMount = () => {
    console.log("Running word-based version...")
    this.props.resetStore();
    this.requestAndUpdateWord();
    this.requestModuleInfo(this);
  }

  componentDidUpdate = (prevProps, prevState) => {
    // check if it's user's first time logging in
    if (this.state.route === "home"
        && prevState.route === "register") {
      this.setState({ walkThroughEnabled: false }) // TODO should be true, if want to enable by default when login first time
      this.setState({ steps1Enabled: true });
      this.setState({ steps2Enabled: false });
      this.setState({ steps3Enabled: false });
      this.setState({ steps4Enabled: false });
      this.setState({ firstIntroductionEnabled: true });
      this.requestModuleInfo(this);
    } 
    if (this.state.userInfo.id !== prevState.userInfo.id) {
      this.props.resetStore();
      this.requestAndUpdateWord();
      this.requestModuleInfo(this);
    }
    if (this.props.wordCompleted 
        && this.props.wordCompleted !== prevProps.wordCompleted) {
      this.requestNewWord();
    }
    if (this.state.route === "home") {
      setTimeout(() => {
        this.setState({ openEndDialogue: true });
      }, USER_TIME_LIMIT_IN_MINUTES * 60000); //USER_TIME_LIMIT_IN_MINUTES
    }
    if (this.state.steps1Enabled === prevState.steps1Enabled
        && !this.state.transitionedFromSteps1ToSteps2) {
      if (this.hintCardRef.current !== null) {
        this.setState({ steps1Enabled: false })
        this.setState({ steps2Enabled: true })
        this.setState({ transitionedFromSteps1ToSteps2: true })
      }
    }
    if (this.state.steps2Enabled === prevState.steps2Enabled
        && !this.state.transitionedFromSteps2ToSteps3
        && this.state.transitionedFromSteps1ToSteps2) {
      if (this.hintCardRef.current === null) {
        this.setState({ steps2Enabled: false })
        this.setState({ steps3Enabled: true })
        this.setState({ transitionedFromSteps2ToSteps3: true })
      }
    }
    if (this.state.steps3Enabled === prevState.steps3Enabled
        && !this.state.transitionedFromSteps3ToSteps4
        && this.state.transitionedFromSteps1ToSteps2
        && this.state.transitionedFromSteps2ToSteps3
        && this.state.firstTimeCompleteWordSinceWalkThru
        ) {
      if (this.wordCardRef.current === null) {
        this.setState({ steps3Enabled: false })
        this.setState({ steps4Enabled: true })
        this.setState({ transitionedFromSteps3ToSteps4: true })
        this.setState({ firstTimeCompleteWordSinceWalkThru: false }) // for future walkthru
      }
    }
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

  parseJapaneseWord = parseJapaneseWord;
  updateCharScore = updateCharScore;
  parseAudio = parseAudio;
  requestModuleInfo = requestModuleInfo;
  requestNewWordPromise = requestNewWordPromise;
  requestNewCharPromise = requestNewCharPromise;
  requestNewWord = async () => {
    if (this.props.version === 1) {
      return this.requestNewWordPromise(this);
    } else if (this.props.version === 2) {
      return this.requestNewCharPromise(this);
    } else {
      console.log(`version should either be 1 or 2`);
    }
  };
  moveToNextWord = moveToNextWord;

  requestAndUpdateWord = async () => {
    await this.requestNewWord();
    this.moveToNextWord(this.state.requestedWord, this);
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
          <WordCard2
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
    } = this.props;
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
      return "Type the character."
    } else if (romajiList[indexCurrentCard] in wrongCharList) {
      return "Press spacebar if you're stuck."
    } else if (indexCurrentCard > 0 
      && indexCurrentCard < cardStateList.length
      && cardStateList[indexCurrentCard - 1] === "correct") {
        return this.randomItem(listOfSoftPraises);
    } else if (wordCompleted && !audioIsPlaying) {
      const cardStateSet = new Set(cardStateList);
      if (cardStateSet.size === 1 && cardStateSet.has("correct")) {
        return `${this.randomItem(listOfPraises)} Press spacebar to continue.`;
      } else {
        return "Click on a character or press spacebar to continue.";
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
  handleEnableBlueButtonSwitch = () => {
    this.setState(
      {checkedEnableBlueButton: !this.state.checkedEnableBlueButton }
    )
  }

  onExitIntroduction = () => {
    this.setState({ firstIntroductionEnabled: false });
  }
  onExitIntro1 = () => {
    this.setState({ steps1Enabled: false });
    this.setState({ disableAllAction: false });
    this.setState({ checkedEnableMessage: true });
  }
  onExitIntro2 = () => {
    this.setState({ steps2Enabled: false });
    this.setState({ disableAllAction: false });
  }
  onExitIntro3 = () => {
    this.setState({ steps3Enabled: false });
    this.setState({ disableAllAction: false });
  }
  onExitIntro4 = () => {
    this.setState({ steps4Enabled: false });
    this.setState({ disableAllAction: false });
    this.setState({ walkThroughEnabled: false });
  }
  
  handleClickWalkthrough = () => {
    // this.clickChild(this.charInputRef.current.formRef.current);
    this.clearFormInput(this.charInputRef.current.formRef.current);
    this.setState({ steps1Enabled: true });
    this.setState({ steps2Enabled: false });
    this.setState({ steps3Enabled: false });
    this.setState({ steps4Enabled: false });
    this.setState({ transitionedFromSteps1ToSteps2: false });
    this.setState({ transitionedFromSteps2ToSteps3: false });
    this.setState({ transitionedFromSteps3ToSteps4: false });
    this.setState({ walkThroughEnabled: true });
    this.setState({ checkedEnableBlueButton: true });
    this.setState({ firstIntroductionEnabled: false });
    this.props.resetStore();
    this.requestAndUpdateWord();
  }

  endWalkThrough = () => {
    this.clearFormInput(this.charInputRef.current.formRef.current);
    this.setState({ steps1Enabled: false });
    this.setState({ steps2Enabled: false });
    this.setState({ steps3Enabled: false });
    this.setState({ steps4Enabled: false });
    this.setState({ transitionedFromSteps1ToSteps2: false });
    this.setState({ transitionedFromSteps2ToSteps3: false });
    this.setState({ transitionedFromSteps3ToSteps4: false });
    this.setState({ walkThroughEnabled: false });
    this.setState({ checkedEnableBlueButton: true });
    this.props.resetStore();
    this.requestAndUpdateWord();
  }

  onBeforeChange1 = (nextStepIndex) => {
    if (nextStepIndex) {
      // select dynamically created elements
      this.steps1.updateStepElement(nextStepIndex);
    }
    if (nextStepIndex === 4) {
      if (!this.hintCardRef.current) {
        return false;
      } else {
        this.steps1.updateStepElement(nextStepIndex);
      }
    }
  }
  onBeforeChange2 = (nextStepIndex) => {
    if (nextStepIndex) {
      this.steps2.updateStepElement(nextStepIndex);
    }
    if (nextStepIndex === 3) {
      if (this.hintCardRef.current !== null) {
        return false;
      } else {
        this.steps2.updateStepElement(nextStepIndex);
      }
    }
  }
  onBeforeChange3 = (nextStepIndex) => {
    if (nextStepIndex) {
      this.steps3.updateStepElement(nextStepIndex);
    }
    if (nextStepIndex === 3) {
      if (this.wordCardRef.current !== null) {
        return false;
      } else {
        this.steps3.updateStepElement(nextStepIndex);
      }
    }
  }
  onBeforeChange4 = (nextStepIndex) => {
    if (nextStepIndex) {
      this.steps4.updateStepElement(nextStepIndex);
    }
  }
  onChangeInSteps = (specialIndex) => (index, _) => {
    if (index !== specialIndex) {
      this.setState({ disableAllAction: true });
    } else {
      this.setState({ disableAllAction: false });
    }
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
            <div className="progress-flex-item2">
              <SmallCharList user_uid={this.state.userInfo.id} />
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
            <div className="progress-flex-item2">
              <KatakanaChart user_uid={this.state.userInfo.id} />
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
        const {
          steps1Enabled,
          steps2Enabled,
          steps3Enabled,
          steps4Enabled,
          steps1,
          steps2,
          steps3,
          steps4,
          initialStep
        } = this.state;
        const generalStepsOptions = {
          showStepNumbers: false,
          hidePrev: true,
          hideNext: true,
          exitOnOverlayClick: false,
          exitOnEsc: false,
          showButtons: true,
          overlayOpacity: 0.5,
          skipLabel: "Skip",
          doneLabel: "Got it!",
        };
        const lastStepsOptions = {
          showStepNumbers: false,
          hidePrev: true,
          hideNext: true,
          showButtons: false,
          overlayOpacity: 0.2,
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
              // onBeforeChange={this.onBeforeChange1}
            >
            </Steps>
            <Steps
              enabled={steps1Enabled && this.state.walkThroughEnabled}
              steps={steps1}
              initialStep={initialStep}
              onExit={this.onExitIntroduction}
              options={generalStepsOptions}
              ref={steps => (this.steps1 = steps)}
              onBeforeChange={this.onBeforeChange1}
              onChange={this.onChangeInSteps(2)}
            />
            <Steps
              enabled={steps2Enabled && this.state.walkThroughEnabled}
              steps={steps2}
              initialStep={initialStep}
              onExit={this.onExitIntro2}
              options={generalStepsOptions}
              ref={steps => (this.steps2 = steps)}
              onBeforeChange={this.onBeforeChange2}
              onChange={this.onChangeInSteps(1)}
            />
            <Steps
              enabled={steps3Enabled && this.state.walkThroughEnabled}
              steps={steps3}
              initialStep={initialStep}
              onExit={this.onExitIntro3}
              options={generalStepsOptions}
              ref={steps => (this.steps3 = steps)}
              onBeforeChange={this.onBeforeChange3}
              onChange={this.onChangeInSteps(2)}
            />
            <Steps
              enabled={steps4Enabled && this.state.walkThroughEnabled}
              steps={steps4}
              initialStep={initialStep}
              onExit={this.onExitIntro4}
              options={generalStepsOptions}
              ref={steps => (this.steps4 = steps)}
              onBeforeChange={this.onBeforeChange4}
            />
            <Dialog
              open={this.state.openEndDialogue}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">
                {"Time's Up!"}
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  <p>
                    {`You have used the app for ${USER_TIME_LIMIT_IN_MINUTES} minute. Please click the link
                    below to take a short test that will assess your Katakana
                    knowledge. Thank you for using the app!`}
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
                handleClickWalkthrough={this.handleClickWalkthrough}
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
              {/* <FormControlLabel
                className="blue-button-visibility-control switch-control"
                label="Display Button"
                labelPlacement="start"
                control={
                  <Switch 
                    checked={this.state.checkedEnableBlueButton}
                    onChange={this.handleEnableBlueButtonSwitch}
                    name="enable-bluebutton" 
                    color="primary"
                  />
                }
              >
              </FormControlLabel> */}
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
                          updateCharScore={this.updateCharScore}
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
                          thisApp={this}
                        />
                      </OutsideAlerter>
                    </Grid>
                    <Grid item className="japanese-word-area">
                      <CharList
                        charsToRead={this.parseJapaneseWord(currentWord)}
                        onClickCard={this.onClickCard}
                        clickedJapChar={this.state.clickedJapChar}
                      />
                    </Grid>
                    <div className="module-level">
                      {`Level ${this.state.moduleInfo ? this.state.moduleInfo.moduleIndex : 0}`}
                    </div>
                    <Grid item>
                      <Box
                        className="progress-bar"
                        // width="30vw" 
                      >
                        <LinearDeterminate 
                          moduleInfo={this.state.moduleInfo} 
                        />
                      </Box>
                    </Grid>
                  </div>
                  {this.state.checkedEnableBlueButton ? (<Grid item > 
                    {!this.props.audioIsPlaying ? (
                      <Button
                        className="main-button"
                        size="large"
                        variant="contained"
                        color="primary"
                        onClick={() => this.clickChild(this.charInputRef.current.formRef.current)}
                        style={{ color: "white" }}
                      >
                        {this.setButtonText()}
                      </Button>
                    ) : (
                      <Button
                        className="main-button"
                        disabled                       
                        size="large"
                        variant="contained"
                        color="primary"
                        onClick={() =>
                          this.clickChild(
                            this.charInputRef.current.formRef.current
                          )
                        }
                        style={{ color: "white" }}
                      >
                        {"Got it"}
                      </Button>
                    )}
                  </Grid>) : null}
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
