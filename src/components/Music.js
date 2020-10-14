// Taken from this https://stackoverflow.com/questions/47686345/playing-sound-in-reactjs
import React from "react";
import { connect } from "react-redux";
import Button from "@material-ui/core/Button";
import { onAudioPlay, onAudioPause } from "../actions";
import "../scss/components/Music.scss";

const mapStateToProps = (state) => {
  return {
    audioIsPlaying: state.changeGeneralState.audioIsPlaying,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onAudioPlay: () => {
      dispatch(onAudioPlay());
    },
    onAudioPause: () => {
      dispatch(onAudioPause());
    },
  };
};

class Music extends React.Component {
  state = {
    play: false,
    audio: new Audio(this.props.audioLink),
  };

  stopAudioHandler = () => {
    this.setState({ play: false });
    if (!this.props.noStoreUpdateWhenEnded) {
      this.props.onAudioPause();
    }
  };

  simpleStopAudioHandler = () => {
    this.setState({ play: false });
    this.props.onAudioPause();
  };

  componentDidMount() {
    this.state.audio.addEventListener("ended", this.stopAudioHandler);
    console.log("TEST",this.props.autoplay)
    setTimeout(() => {
      if (this.props.autoplay) {
        this.state.audio.play();
        this.props.onAudioPlay(); 
      }
    }, this.props.delay);
  }

  componentDidUpdate = (prevProps) => {
    if (prevProps.audioLink !== this.props.audioLink) {
      var newAudio = new Audio(this.props.audioLink);
      newAudio.addEventListener("ended", this.stopAudioHandler);
      this.setState({ audio: newAudio });
      setTimeout(() => {
        this.state.audio.play();
        this.props.onAudioPlay();
      }, this.props.delay);
    }
  };

  componentWillUnmount() {
    this.state.audio.removeEventListener("ended", this.stopAudioHandler);
    this.state.audio.removeEventListener("ended", this.simpleStopAudioHandler);
    this.props.onAudioPause();
  }

  togglePlay = () => {
    this.setState({ play: !this.state.play }, () => {
      if (this.state.play) {
        this.state.audio.play();
        this.props.onAudioPlay();

        // this is a wacky way of doing it, but basically I'm replacing the "ended" event listener
        this.state.audio.removeEventListener("ended", this.stopAudioHandler);
        this.state.audio.removeEventListener(
          "ended",
          this.simpleStopAudioHandler
        );
        this.state.audio.addEventListener("ended", this.simpleStopAudioHandler);
      } else {
        this.state.audio.pause();
        this.props.onAudioPause();
      }
    });
  };

  render() {
    return (
      <div>
        <Button
          variant="text"
          color="primary"
          onClick={this.togglePlay}
          className="music-button"
        >
          <div className="button-text">
            {this.state.play ? "Pause Audio" : "Play Audio"}
          </div>
        </Button>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Music);
