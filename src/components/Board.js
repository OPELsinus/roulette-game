import React, { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import './Board.css';
import RouletteImage from './Roulette.png';
import TonWallet from './TonWallet.jpg';
import { Address } from '@ton/core';

console.log("Board component is rendering...");

const red_numbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const numbers = [
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34], // First column
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35], // Second column
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36], // Third column
];

const specialButtons = [
  { label: '1-12', value: '1-12' },
  { label: '13-24', value: '13-24' },
  { label: '25-36', value: '25-36' },
  { label: 'Odd', value: 'odd' },
  { label: 'Even', value: 'even' },
  { label: '1-18', value: '1-18' },
  { label: 'Red', value: 'red' },
  { label: 'Black', value: 'black' },
  { label: '19-36', value: '19-36' },
];

const chipValues = [1, 5, 10, 25, 50, 100]; // Available chip values

const Board = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [selectedChips, setSelectedChips] = useState({}); // Object to store chips for each cell
  const [isGameStarted, setIsGameStarted] = useState(false); // State to track game start
  const [winningNumber, setWinningNumber] = useState(null); // State to store the winning number
  const [currentChipValue, setCurrentChipValue] = useState(1); // State to track selected chip value
  const formattedAddress = wallet?.account?.address
    ? Address.parse(wallet.account.address).toString({
        bounceable: false,
        testOnly: false,
      })
    : 'Not connected';

  const isRed = (number) => red_numbers.includes(number);

  const disconnect = () => {
    tonConnectUI.disconnect();
  };

  const handleDisconnect = () => {
    disconnect(); // This clears cached wallet data
  };

  const getRandomPosition = () => {
    const x = Math.random() * 80; // Random x position (0% to 80%)
    const y = Math.random() * 80; // Random y position (0% to 80%)
    return { x, y };
  };

  const handleClick = (value) => {
    if (isGameStarted || !wallet) return; // Disable clicks when the game is started or wallet is not connected
    console.log(`Cell clicked: ${value}`); // Debugging log
    const newChip = {
      id: Date.now(), // Unique ID for each chip
      position: getRandomPosition(), // Random position within the cell
      value: currentChipValue, // Store the chip value
    };
    setSelectedChips((prev) => {
      const newState = {
        ...prev,
        [value]: [...(prev[value] || []), newChip], // Add new chip to the cell
      };
      console.log('Updated selectedChips:', newState); // Debugging log
      return newState;
    });
  };

  return (
    <div className={`board ${isGameStarted ? 'game-started' : ''}`}>
      <div className="roulette-header">
        <img src={RouletteImage} alt="Roulette" className="roulette-image" />
        {wallet ? (
          <div>
            <span className="wallet-address">
              {formattedAddress.slice(0, 5)}...
              {formattedAddress.slice(-5)}
            </span>
            <button className="disconnect-button" onClick={disconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <img
            src={TonWallet}
            alt="Connect Wallet"
            className="wallet-image"
            onClick={() => tonConnectUI.connectWallet()}
          />
        )}
      </div>

      {/* Chip Value Selector */}
      <div className="chip-value-selector">
        <p>Select Chip Value:</p>
        {chipValues.map((value) => (
          <button
            key={value}
            className={`chip-value-button ${currentChipValue === value ? 'active' : ''}`}
            onClick={() => setCurrentChipValue(value)}
          >
            ${value}
          </button>
        ))}
      </div>

      {/* Zero Row */}
      <div className="zero-row">
        <div className="cell zero" onClick={() => handleClick(0)}>
          0
          {selectedChips[0]?.map((chip) => (
            <div
              key={chip.id}
              className="chip"
              style={{
                left: `${chip.position.x}%`,
                top: `${chip.position.y}%`,
              }}
            >
              ${chip.value} {/* Display chip value */}
            </div>
          ))}
        </div>
        {/* Lobby Name */}
        <div className="lobby-name">Lobby Name Lg</div>
      </div>

      {/* Main Grid: Numbers + Special Buttons */}
      <div className="main-grid">
        {/* Number Columns */}
        <div className="number-columns">
          {numbers.map((column, colIndex) => (
            <div key={colIndex} className="column">
              {column.map((number) => (
                <div
                  key={number}
                  className={`cell number ${isRed(number) ? 'red' : 'black'}`}
                  onClick={() => handleClick(number)}
                >
                  {number}
                  {selectedChips[number]?.map((chip) => (
                    <div
                      key={chip.id}
                      className="chip"
                      style={{
                        left: `${chip.position.x}%`,
                        top: `${chip.position.y}%`,
                      }}
                    >
                      ${chip.value} {/* Display chip value */}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Special Buttons Columns */}
        <div className="special-columns">
          <div className="column">
            {specialButtons.slice(0, 3).map((button, index) => (
              <div
                key={index}
                className="cell special"
                onClick={() => handleClick(button.value)}
              >
                {button.label}
                {selectedChips[button.value]?.map((chip) => (
                  <div
                    key={chip.id}
                    className="chip"
                    style={{
                      left: `${chip.position.x}%`,
                      top: `${chip.position.y}%`,
                    }}
                  >
                    ${chip.value} {/* Display chip value */}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="column">
            {specialButtons.slice(3, 5).map((button, index) => (
              <div
                key={index}
                className="cell special"
                onClick={() => handleClick(button.value)}
              >
                {button.label}
                {selectedChips[button.value]?.map((chip) => (
                  <div
                    key={chip.id}
                    className="chip"
                    style={{
                      left: `${chip.position.x}%`,
                      top: `${chip.position.y}%`,
                    }}
                  >
                    ${chip.value} {/* Display chip value */}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="column">
            {specialButtons.slice(5).map((button, index) => (
              <div
                key={index}
                className="cell special"
                onClick={() => handleClick(button.value)}
              >
                {button.label}
                {selectedChips[button.value]?.map((chip) => (
                  <div
                    key={chip.id}
                    className="chip"
                    style={{
                      left: `${chip.position.x}%`,
                      top: `${chip.position.y}%`,
                    }}
                  >
                    ${chip.value} {/* Display chip value */}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Start Game Button */}
      <button className="start-game-button" onClick={() => setIsGameStarted(true)}>
        Start Game
      </button>
    </div>
  );
};

export default Board;