import { makeObservable, observable, action } from "mobx";

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

  constructor() {
    makeObservable(this, {
      bgClicked: observable,
      user: observable,
      setUser: action,
      setBgClicked: action,
    });
  }

  setBgClicked = (bgClicked: boolean) => {
    this.bgClicked = bgClicked;
  };

  setUser = (user: User) => {
    this.user = user;
  };
}
