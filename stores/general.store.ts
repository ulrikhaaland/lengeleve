import { makeObservable, observable, action } from 'mobx';

export interface User {
  ageGroup?: string;
  gender?: string;
  activityLevel?: string;
  dietaryPreferences?: string;
  healthGoals?: string;
  sleepHabits?: string;
  timeAvailability?: string;
}

export enum ChatMode {
  general = 'General',
  specific = 'Specific',
}

export default class GeneralStore {
  bgClicked: boolean = false;
  user: User = {};
  hasAskedQuestion: boolean = false;
  chatMode: ChatMode = ChatMode.general;

  constructor() {
    makeObservable(this, {
      bgClicked: observable,
      user: observable,
      hasAskedQuestion: observable,
      chatMode: observable,
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
