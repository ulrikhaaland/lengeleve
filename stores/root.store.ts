import GeneralStore from './general.store';
import SettingsStore from './settings.store';

class RootStore {
  generalStore: GeneralStore;
  settingsStore: SettingsStore;

  constructor() {
    this.generalStore = new GeneralStore();
    this.settingsStore = new SettingsStore();
  }
}

export default RootStore;
