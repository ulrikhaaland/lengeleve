import GeneralStore from './general.store';

class RootStore {
  generalStore: GeneralStore;

  constructor() {
    this.generalStore = new GeneralStore();
  }
}

export default RootStore;
