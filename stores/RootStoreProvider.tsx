import React, { createContext, useContext } from 'react';
import RootStore from './root.store';

interface ComponentProps {
  children: React.ReactNode;
}

const RootStoreContext = createContext(new RootStore());

export const RootStoreProvider = ({ children }: ComponentProps) => {
  const store = new RootStore();
  return (
    <RootStoreContext.Provider value={store}>
      {children}
    </RootStoreContext.Provider>
  );
};

export const useStore = (): RootStore => {
  const store = useContext(RootStoreContext);
  if (!store) {
    throw new Error('useStore must be used within a storeProvider');
  }
  return store;
};
