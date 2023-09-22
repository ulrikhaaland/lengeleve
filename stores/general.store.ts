import { getPreQuestion } from "@/utils/preQuestion";
import { makeObservable, observable, action } from "mobx";

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
  general = "General",
  specific = "Specific",
}

export default class GeneralStore {
  bgClicked: boolean = false;
  user: User = {};
  hasAskedQuestion: boolean = false;
  chatMode: ChatMode = ChatMode.general;
  previousQuestions: string[] = [];
  placeholder: string = "What is longevity?";

  constructor() {
    makeObservable(this, {
      bgClicked: observable,
      user: observable,
      hasAskedQuestion: observable,
      chatMode: observable,
      placeholder: observable,
      previousQuestions: observable,
      setPlaceholder: action,
      setPreviousQuestions: action,
      genPreQuestion: action,
    });
    this.genPreQuestion();
  }
  genPreQuestion = async () => {
    try {
      const preQuestion = await getPreQuestion(this.previousQuestions);
      this.setPlaceholder(
        preQuestion?.replaceAll('"', "") ?? "What is longevity?"
      );
    } catch (error) {
      console.log("Error generating pre-question:", error);
    }
  };

  setPlaceholder = (placeholder: string) => {
    this.placeholder = placeholder;
  };

  setPreviousQuestions = (questions: string[]) => {
    this.previousQuestions = questions;
  };

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
