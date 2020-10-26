import {
  GETWORD_URL,
  UPDATECHARSCORE_URL,
  WORDSCORE_URL,
  MEDIA_BASE_URL_WORD,
  USER_TIME_LIMIT_IN_MINUTES,
  GETMODULEINFO_URL,
  GETCHAR_URL,
  VERSION,
} from "../constants";
import { katakanaToRomaji } from "../jap-char";

const parseJapaneseWord = (katakana_word) => {
  var charsToRead = [];
  for (const katakana_char of katakana_word) {
    var katakana_romaji = katakanaToRomaji[katakana_char] || "??";
    charsToRead.push({ 
      char: katakana_char, 
      romaji: katakana_romaji 
    });
  }
  return charsToRead;
};

const updateCharScore = (user_uid, katakana_char, score) => {
  fetch(UPDATECHARSCORE_URL, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_uid: user_uid,
      char: katakana_char,
      score: score,
    }),
  })
    .then((res) => res.json())
    .then(() => {})
    .catch((error) => {
      console.log("Failed to update char score", error);
    });
};

// not used
const updateWordScore = (user_uid, word) => {
  fetch(WORDSCORE_URL, {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_uid: user_uid,
      word: word,
      unix_time: this.state.currentWord_unix_time,
    }),
  })
  .then((res) => res.json())
  .then(() => {
    this.requestNewWord();
  })
  .catch((error) => {
    console.log("Failed to update word score", error);
  });
};

const parseAudio = (audio_string) => {
  return audio_string.slice(7, audio_string.length - 1);
};

const requestModuleInfo = (thisApp) => {
  const version = VERSION === 2 ? "2" : "";
  fetch(GETMODULEINFO_URL, {
    method: "post",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({
      userId: thisApp.state.userInfo.id,
      version: version,
    }),
  })
  .then((res) => res.json())
  .then((moduleInfoObject) => {
    thisApp.setState({ moduleInfo: moduleInfoObject });
  })
  .catch((error) => {
    console.log(`Error in requestModuleInfo: ${error}`);
  });
}

const requestNewWordPromise = async (thisApp) => {
  return new Promise(resolve => {
    thisApp.setState({ clickedJapChar: "" });
    thisApp.setState({ isFetchingWord: true })
    thisApp.setState({ wordRequestTimeStamp: Date.now() })
    fetch(GETWORD_URL, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_uid: thisApp.state.userInfo.id,
      }),
    })
    .then((res) => res.json())
    .then((word) => {
      if (word === "END GAME") {
        thisApp.setState({ openEndDialogue: true });
      }
      thisApp.setState({ isFetchingWord: false });
      thisApp.setState({ requestedWord: word });
      resolve();
    })
    .catch((err) => {
      console.log("Error in getting next word", err);
    });
  });
};

const requestNewCharPromise = async (thisApp) => {
  return new Promise(resolve => {
    thisApp.setState({ clickedJapChar: "" });
    thisApp.setState({ isFetchingWord: true });
    thisApp.setState({ wordRequestTimeStamp: Date.now() });
    fetch(GETCHAR_URL, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_uid: thisApp.state.userInfo.id,
      }),
    }).then((res) => res.json())
      .then((word) => {         
        thisApp.setState({ isFetchingWord: false });
        thisApp.setState({ requestedWord: word });
        resolve();
      })
      .catch((err) => {
        console.log("Error in getting next char", err);
      });
  });
};

const requestNewWord = async (thisApp) => {
  if (thisApp.props.version === 1) {
    return requestNewWordPromise(thisApp);
  } else if (thisApp.props.version === 2) {
    return requestNewCharPromise(thisApp);
  } else {
    console.log(`version should either be 1 or 2`);
  }
};

const transitionToNextWord = async (word, thisApp) => {
  const { setCurrentChar, updateWord } = thisApp.props;
  var romajiList = [];
  thisApp.requestModuleInfo(thisApp);
  if (Object.keys(word).includes("word")) {
    romajiList = parseJapaneseWord(word.word).map(
    (kana_char) => kana_char.romaji
    );
    updateWord(word.word, romajiList);
    setCurrentChar(word.word.charAt(0), romajiList[0]);
  } else {
    romajiList = parseJapaneseWord(word.vocab_kana).map(
      (kana_char) => kana_char.romaji
    );
    updateWord(word.vocab_kana, romajiList);
    setCurrentChar(word.vocab_kana.charAt(0), romajiList[0]);
    const word_audio = new Audio(audio_url);
    const audio_url = `${MEDIA_BASE_URL_WORD}${parseAudio(word.vocab_sound_local)}`
    word_audio.addEventListener("loadedmetadata", (event) => {
      console.log("audio duration", event.target.duration)
      thisApp.setState({
        word_audio_duration: event.target.duration,
      });
    });
  }
  thisApp.setState({ currentWordInfo: word });
  thisApp.setState({ currentWord_unix_time: Date.now() });
};

const transitionToNextChar = async (char, thisApp) => {
  const { setCurrentChar, updateWord } = thisApp.props;
  setCurrentChar(char, katakanaToRomaji[char]);
  updateWord(char, [katakanaToRomaji[char]]);
  thisApp.setState({ currentWordInfo: char });
  thisApp.setState({ currentWord_unix_time: Date.now() });
  thisApp.requestModuleInfo(thisApp);
};

const moveToNextWord = async (word, thisApp) => {
  if (thisApp.props.version === 1) {
    transitionToNextWord(word, thisApp);
  } else if (thisApp.props.version === 2) {
    transitionToNextChar(word, thisApp);
  } else {
    console.log(`version should either be 1 or 2`);
  }
};

export {
  parseJapaneseWord,
  updateCharScore,
  parseAudio,
  requestModuleInfo,
  requestNewWordPromise,
  requestNewCharPromise,
  transitionToNextWord,
  transitionToNextChar,
  moveToNextWord,
  requestNewWord,
};
