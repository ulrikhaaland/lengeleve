import { RootStoreProvider } from '@/stores/RootStoreProvider';
import '@/styles/globals.css';
import { Inter } from '@next/font/google';
import { Provider } from 'mobx-react';
import type { AppProps } from 'next/app';

const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps<{}>) {
  return (
    <main className={inter.className}>
      <Provider>
        <RootStoreProvider>
          <Component {...pageProps} />
        </RootStoreProvider>
      </Provider>
    </main>
  );
}
