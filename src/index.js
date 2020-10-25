import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore, combineReducers, applyMiddleware } from "redux";
import { createLogger } from "redux-logger";
import "./scss/index.scss";
import * as serviceWorker from "./serviceWorker";
// import "tachyons"; // mess with material-ui Textfield
import App2 from "./containers/App2.js"; // char-based version
import App from "./containers/App.js"; // word-based version
import {
  changeGeneralState,
  changeInputBox,
  changeCardState,
} from "./reducers";
import { PRIMARYCOLOR } from "./constants.js"
import { createMuiTheme, ThemeProvider } from "@material-ui/core";
import "typeface-roboto";
import LogRocket from "logrocket";

LogRocket.init("zskhtw/japanese-learning");

const theme = createMuiTheme({
  palette: {
    // type: "dark",
    primary: {
      main: PRIMARYCOLOR,
    },
    secondary: {
      main: "#ffffff",
    },
  },
  overrides: {
    MuiButton: {
      iconSizeMedium: {
        "& > *:first-child": {
          fontSize: 22 // change global icon size
        }
      }
    }
  }
});

const rootReducer = combineReducers({
  changeGeneralState,
  changeInputBox,
  changeCardState,
});

const logger = createLogger();

// const store = createStore(rootReducer, applyMiddleware(logger));
const store = createStore(
  rootReducer,
  applyMiddleware(logger, LogRocket.reduxMiddleware())
);

ReactDOM.render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <App2 />
    </ThemeProvider>
  </Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
