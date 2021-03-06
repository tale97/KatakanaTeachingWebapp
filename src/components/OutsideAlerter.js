// https://stackoverflow.com/questions/32553158/detect-click-outside-react-component

import React from "react";
import PropTypes from "prop-types";

class OutsideAlerter extends React.Component {
  componentDidMount = () => {
    document.addEventListener("mousedown", this.handleClickOutside);
  };

  componentWillUnmount = () => {
    document.removeEventListener("mousedown", this.handleClickOutside);
  };

  setWrapperRef = (node) => {
    this.wrapperRef = node;
  };

  handleClickOutside = (event) => {
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      // for some reason, need setTimeout to work, even if 0 delay
      setTimeout(() => {
        this.props.focusInputBox();
      }, 0);
    }
  };

  render() {
    return <div ref={this.setWrapperRef}>{this.props.children}</div>;
  }
}

OutsideAlerter.propTypes = {
  children: PropTypes.element.isRequired,
};

export default OutsideAlerter;
