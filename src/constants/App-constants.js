import { VERSION } from "../constants";

const listOfPraises = [
  "Great job!",
  "You're a pro!",
  "You're getting better!",
  "You're getting good at this!",
  "You're getting good!",
  "Well done!",
  "Nicely done!",
  "Good job!",
];

const listOfSoftPraises = [
  "Correct!",
  "Nice!",
  "Good!",
  "Awesome!",
  "Well done!",
  "Great!",
  "Good job!",
  "Bravo!",
];

const listOfEncouragements = [
  "You got this!",
  "Let's try again.",
  "You can do this!",
  "Try again.",
];

const welcomeText = (version) => {
  return (version === 1 ? (
    `Welcome! Your challenging is to type out the pronunciation of Japanese words.`
  ) : (
    `Welcome! Your challenging is to type out the pronunciation of Japanese characters.`
  ));
};

const Introduction = [
  {
    intro: welcomeText(VERSION),
  },
  {
    intro: "If you don't know a Japanese character, simply press SPACEBAR to learn them.",
  },
  {
    element: ".nav-button-home",
    intro: `You are currently on the 'Home' tab.`,
    position: "bottom"
  },
  {
    element: ".nav-button-chart",
    intro: "Don't forget to check in on these two tabs to view your progress!",
    position: "bottom",
  },
  {
    intro: `I hope you have fun learning!`,
  },
];

export { 
  listOfPraises,
  listOfSoftPraises,
  listOfEncouragements,
  Introduction,
};