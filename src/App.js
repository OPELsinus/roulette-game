import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import Board from './components/Board';

function App() {
  return (
    <TonConnectUIProvider manifestUrl="https://roulette-game-pearl.vercel.app/tonconnect-manifest.json">
      <div>
        <Board />
      </div>
    </TonConnectUIProvider>
  );
}

export default App;