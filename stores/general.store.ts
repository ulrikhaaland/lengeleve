import { makeObservable, observable, action } from 'mobx';

export default class GeneralStore {
  bgClicked: boolean = false;

  constructor() {
    makeObservable(this, {
      bgClicked: observable,
    });
  }
}
