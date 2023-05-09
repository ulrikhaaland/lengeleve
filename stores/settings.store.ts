import endent from 'endent';
import { makeObservable, observable, action } from 'mobx';

export interface Settings {
  topic?: string;
  goals?: string[];
  topicGoal?: string;
  depth?: string;
  learningStyle?: string;
  communicationStyle?: string;
  toneStyle?: string;
  reasoningFramework?: string;
}

export enum ChatMode {
  answering = 'Answering',
  questioning = 'Questioning',
}

export default class SettingsStore {
  settings: Settings = {
    topic: topic,
    goals: goals,
    topicGoal: goals[0],
    depth: depth,
    learningStyle: learningStyle,
    communicationStyle: communicationStyle,
    toneStyle: toneStyle,
    reasoningFramework: reasoningFramework,
  };
  chatMode: ChatMode = ChatMode.answering;

  constructor() {
    makeObservable(this, {
      settings: observable,
      chatMode: observable,
    });
  }

  setSettings(settings: Settings) {
    this.settings = settings;
  }

  setChatMode(chatMode: ChatMode) {
    this.chatMode = chatMode;
  }
}

const topic = 'Geografi (GEO01‑02)';
const goals = [
  'Utforske og presentere geografiske forhold og prosesser ved å bruke ulike kilder, inkludert kart.',
  'Gjøre rede for hvordan indre og ytre krefter har dannet ulike landskap, og utforske og gi eksempler på hvordan menneskene som bor der, kan utnytte ressursene.',
  'Drøfte ulike interesser knyttet til ressurs- og arealbruk i Norge, Sápmi/Sábme/Sáepmie og nordområdene.',
  'Reflektere over sin egen ressursbruk og ressursbruken i Norge i et globalt og bærekraftig perspektiv.',
  'Utforske hva endringer i klimaet betyr for natur og samfunn lokalt, regionalt eller globalt.',
  'Utforske og gjøre rede for årsakene til en aktuell natur- eller miljøkatastrofe og konsekvenser for mennesker, samfunn og natur.',
  'Gjøre rede for årsaker til demografiske endringer og drøfte ulike levekår i forskjellige deler av verden.',
  'Gjennomføre et feltarbeid for å undersøke og presentere geografiske forhold.',
];

const depth =
  'Level_1: Surface level: Covers topic basics with simple definitions and brief explanations, suitable for beginners or quick overviews.';
const learningStyle =
  'Sequential: Linear, orderly learn in small incremental steps';
const communicationStyle =
  'Resembles language in textbooks, using well-structured sentences, rich vocabulary, and focusing on clarity and coherence.';
const toneStyle =
  'Supportive and empathetic, provides positive reinforcement. Ideal for sensitive learners preferring collaboration.';
const reasoningFramework =
  'Draws conclusions from general principles, promoting critical thinking and logical problem-solving skills.';
