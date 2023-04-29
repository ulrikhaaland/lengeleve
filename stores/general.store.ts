import { makeObservable, observable, action } from 'mobx';

export interface User {
  ageGroup?: string;
  gender?: string;
  activityLevel?: string;
  dietaryPreferences?: string;
  healthGoals?: string;
  allergies?: string;
  sleepHabits?: string;
  stressLevels?: string;
  timeAvailability?: string;
}

export default class GeneralStore {
  bgClicked: boolean = false;
  user: User = {};
  hasAskedQuestion: boolean = false;

  constructor() {
    makeObservable(this, {
      bgClicked: observable,
      user: observable,
      hasAskedQuestion: observable,
      setUser: action,
      setBgClicked: action,
      setHasAskedQuestion: action,
    });
  }

  setHasAskedQuestion = (hasAskedQuestion: boolean) => {
    this.hasAskedQuestion = hasAskedQuestion;
  };

  setBgClicked = (bgClicked: boolean) => {
    this.bgClicked = bgClicked;
  };

  setUser = (user: User) => {
    this.user = user;
  };
}
