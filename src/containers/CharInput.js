import React from "react";
import { connect } from "react-redux";
import "../scss/containers/App.scss";
import { Input } from "@material-ui/core";
import SpellCheckerBuffer from "../inputChecker";
import { katakanaToRomaji } from "../jap-char";
import {
  pressKey,
  onCorrectChar,
  typeAnswer,
  pressSpace,
  typeWrongAnswer,
  completeChar,
  pressEnter,
  updateChar,
  updateWord,
  completeWord,
  alertRomajiNotInDict,
  resetRomajiNotInDictAlert,
} from "../actions";

const mapStatestoProps = (state) => {
  return {
    indexCurrentCard: state.changeCardState.indexCurrentCard,
    romajiList: state.changeCardState.romajiList,
    cardStateList: state.changeCardState.cardStateList,
    curWrongChar: state.changeCardState.curWrongChar,
    onIncorrectCard: state.changeCardState.onIncorrectCard,
    wordCompleted: state.changeCardState.wordCompleted,
    onHintedCard: state.changeCardState.onHintedCard,
    currentRomaji: state.changeCardState.currentRomaji,
    currentWord: state.changeCardState.currentWord,
    audioIsPlaying: state.changeGeneralState.audioIsPlaying,
    inputBox: state.changeInputBox.inputBox,
  };
};
const mapDispatchToProps = (dispatch) => {
  return {
    onInputBoxChange: (value) => {
      dispatch(typeAnswer(value));
    },
    onKeyPress: (key) => {
      dispatch(pressKey(key));
    },
    onCorrectChar: () => {
      dispatch(onCorrectChar());
    },
    onSpacePress: (context) => {
      dispatch(pressSpace(context));
    },
    onWrongInput: (userChar, currentChar) => {
      dispatch(typeWrongAnswer(userChar, currentChar));
    },
    onCompleteChar: (time, type) => {
      dispatch(completeChar(time, type));
    },
    onEnterPress: (time) => {
      dispatch(pressEnter(time));
    },
    setCurrentChar: (japchar, romaji) => {
      dispatch(updateChar(japchar, romaji));
    },
    updateWord: (word, romajiList) => {
      dispatch(updateWord(word, romajiList));
    },
    onWordCompletion: () => {
      dispatch(completeWord());
    },
    alertRomajiNotInDict: () => {
      dispatch(alertRomajiNotInDict());
    },
    resetRomajiNotInDictAlert: () => {
      dispatch(resetRomajiNotInDictAlert());
    },
  };
};

class CharInput extends React.Component {
  constructor(props) {
    super(props);
    this.formRef = React.createRef();
    this.inputChecker = new SpellCheckerBuffer(
      katakanaToRomaji,
      this.checkFunction,
      this.props.alertRomajiNotInDict
    );
  }

  componentDidMount() {
    const {
      setCurrentChar,
      romajiList,
      indexCurrentCard,
      currentWord,
    } = this.props;

    const curRomaji = romajiList[indexCurrentCard];
    const curKana = currentWord[indexCurrentCard];
    setCurrentChar(curKana, curRomaji);

    // https://stackoverflow.com/questions/37949981/call-child-method-from-parent
    this.props.setClick(this.buttonClickOrSpacePressHandler);
    this.props.matchClearFormInputFunction(this.clearInputBox);
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.user_uid === prevProps.user_uid) {
    }
  };

  fillHintedCharacter = (event) => {
    const {
      onHintedCard,
      indexCurrentCard,
      romajiList,
      onWordCompletion,
      currentRomaji,
      onInputBoxChange,
      onEnterPress,
      setCurrentChar,
      currentWord,
    } = this.props;

    if (onHintedCard) {
      if (indexCurrentCard === romajiList.length - 1) {
        onWordCompletion();
      }
      // autofill correct answer
      event.target.value = event.target.value.concat(currentRomaji);
      onInputBoxChange(event.target.value);
      onEnterPress(Date.now());

      const curRomaji = romajiList[indexCurrentCard + 1];
      const curKana = currentWord[indexCurrentCard + 1];
      setCurrentChar(curKana, curRomaji);
    }
  }

  checkFunction = (char) => {
    const {
      romajiList,
      indexCurrentCard,
      onCorrectChar,
      onWrongInput,
      onWordCompletion,
      currentWord,
      setCurrentChar,
      onCompleteChar,
      getKeyByValue,
      updateCharScore,
      user_uid,
      onHintedCard,
      onEnterPress,
    } = this.props;
    const userInputChar = getKeyByValue(katakanaToRomaji, char);

    if (char === romajiList[indexCurrentCard] && !onHintedCard) {
      updateCharScore(user_uid, userInputChar, "+1");
      onCorrectChar();
      onCompleteChar(Date.now(), "correct");
      const newRomaji = romajiList[indexCurrentCard + 1];
      const newKana = currentWord[indexCurrentCard + 1];
      setCurrentChar(newKana, newRomaji); 
      if (indexCurrentCard === romajiList.length - 1) {
        onWordCompletion();
      }
      console.log(`CORRECT!`)
      this.props.requestModuleInfo(this.props.thisApp);
    } else if (char === romajiList[indexCurrentCard] && onHintedCard) {
      if (indexCurrentCard === romajiList.length - 1) {
        onWordCompletion();
      }
      onEnterPress(Date.now()); // mimic spacepress to fill hinted char
      const newRomaji = romajiList[indexCurrentCard + 1];
      const newKana = currentWord[indexCurrentCard + 1];
      setCurrentChar(newKana, newRomaji);
      // onCompleteChar(Date.now(), "hinted"); // maybe this should be here instead of when just requested for hint
    } else {
      onWrongInput(char, romajiList[indexCurrentCard]);
      var currentChar = getKeyByValue(
        katakanaToRomaji,
        romajiList[indexCurrentCard]
      );
      updateCharScore(user_uid, userInputChar, "0");
      updateCharScore(user_uid, currentChar, "0");
      this.props.requestModuleInfo(this.props.thisApp);
    }
  };

  onKeyDown = (event) => {
    const {
      onIncorrectCard,
      wordCompleted,
      romajiList,
      indexCurrentCard,
      onWordCompletion,
      audioIsPlaying,
      cardStateList,
      disableAllAction,
      walkThroughEnabled,
      endWalkThrough,
      onInputBoxChange,
    } = this.props;
    const { which } = event;
    const lastCardState = cardStateList[cardStateList.length - 1];
    
    if (walkThroughEnabled) {
      if (which === 27) {
        endWalkThrough();
      } else if (disableAllAction) {
        return event.preventDefault();
      }
    }
    if (audioIsPlaying) {
      return event.preventDefault();
    }
    if (
      indexCurrentCard === romajiList.length - 1 &&
      (lastCardState === "correct" || lastCardState === "hinted")
    ) {
      onWordCompletion();
    }
    // keycode 65 to 90 represents a-z
    if (
      ((which >= 65 && which <= 90) || which === 222) &&
      !onIncorrectCard &&
      !wordCompleted
    ) {
      var key =
        which === 222
          ? "'"
          : String.fromCharCode(which).toLowerCase();
      this.props.onKeyPress(key);
      this.inputChecker.checkInput(key);
      onInputBoxChange(event.target.value);
    } else {
      event.preventDefault();
      if (which === 32) { // space
        this.buttonClickOrSpacePressHandler(event);
      } else if (which === 8) { // backspace
        this.deleteIncorrectInput(event);
      } else if (which === 13) { // enter
        this.goToNextWord(event);
        // this.fillHintedCharacter(event);
      }
    }
  };

  deleteIncorrectInput(event) {
    const {
      onIncorrectCard,
      curWrongChar,
      onInputBoxChange,
      onSpacePress,
      resetRomajiNotInDictAlert,
    } = this.props;
    const { value } = event.target;
    if (onIncorrectCard) {
      // delete wrong input from inputBox
      event.target.value = value.slice(0, -curWrongChar.length);
      onInputBoxChange(value);
      onSpacePress("CONTINUE_AFTER_ERROR");
      resetRomajiNotInDictAlert();
    } else {
      // clear current input
      this.clearCurrentInput(event);
    }
  };

  clearInputBox(event) {
    event.target.value = "";
  };

  goToNextWord(event) {
    const {
      onSpacePress,
      onInputBoxChange,
      wordCompleted,
      moveToNextWord,
      requestedWord,
      firstTimeCompleteWordSinceWalkThrough,
      thisApp,
    } = this.props;

    if (wordCompleted) {
      firstTimeCompleteWordSinceWalkThrough()
      moveToNextWord(requestedWord, thisApp);
      onSpacePress("CONTINUE_AFTER_COMPLETE");
      event.target.value = "";
      onInputBoxChange(event.target.value);
    }
  }

  buttonClickOrSpacePressHandler = (event) => {
    const {
      onIncorrectCard,
      onSpacePress,
      onCompleteChar,
      wordCompleted,
      onHintedCard,
      romajiList,
      indexCurrentCard,
      user_uid,
      updateCharScore,
      getKeyByValue,
      disableAllAction,
    } = this.props;
    
    if (disableAllAction) {
      return;
    }

    if (onIncorrectCard) {
      this.deleteIncorrectInput(event)
    } else if (!onIncorrectCard && !onHintedCard && !wordCompleted) {
      // ask for hint
      this.props.requestModuleInfo(this.props.thisApp);
      onSpacePress("REQUEST_HINT");
      onCompleteChar(Date.now(), "hinted");

      var currentChar = getKeyByValue(
        katakanaToRomaji,
        romajiList[indexCurrentCard]
      );
      updateCharScore(user_uid, currentChar, "+0");
      this.props.requestModuleInfo(this.props.thisApp);
      // clear current input
      this.clearCurrentInput(event);
    } else if (wordCompleted) {
      this.goToNextWord(event)
    } else if (onHintedCard) {
      // this.fillHintedCharacter(event);
    }
  };

  clearCurrentInput = (event) => {
    const {onInputBoxChange} = this.props;

    event.target.value = this.inputChecker.buffer.length
      ? event.target.value.slice(0, -this.inputChecker.buffer.length)
      : event.target.value;
    onInputBoxChange(event.target.value);

    // clear inputChecker buffer
    this.inputChecker.checkInput("clearBuffer");
  }

  render() {
    return (
      <form>
        <Input
          className="input-box"
          placeholder="Your input..."
          inputProps={{ "aria-label": "description" }}
          // onChange={this.props.onInputBoxChange} // this line cause tons of warnings
          onKeyDown={this.onKeyDown}
          spellCheck={false}
          autoFocus
          inputRef={this.formRef}
          onPaste={(event) => {
            event.preventDefault();
          }}
        />
      </form>
    );
  }
}

export default connect(mapStatestoProps, mapDispatchToProps, null, {
  forwardRef: true,
})(CharInput);
