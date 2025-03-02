import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import Board from './components/Board'; // Adjust the import path as needed

function App() {
  return (
    <TonConnectUIProvider manifestUrl="https://roulette-game-pearl.vercel.appg/tonconnect-manifest.json">
      <div>
        <Board />
      </div>
    </TonConnectUIProvider>
  );
}

export default App;