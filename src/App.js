import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import Board from './components/Board'; // Adjust the import path as needed

function App() {
console.log("Board component is rendering...");
  return (
    <TonConnectUIProvider manifestUrl="https://roulette-game-pearl.vercel.app//tonconnect-manifest.json">
      <div>
        <Board />
      </div>
    </TonConnectUIProvider>
  );
}

export default App;