import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import './Board.css';
import RouletteImage from './Roulette.png';
import TonWallet from './TonWallet.jpg';

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

  const isRed = (number) => red_numbers.includes(number);

  // Function to generate a random position within the cell
  const getRandomPosition = () => {
    const x = Math.random() * 80; // Random x position (0% to 80%)
    const y = Math.random() * 80; // Random y position (0% to 80%)
    return { x, y };
  };

  const setWallet = useState(null);
  const connectWallet = async () => {
    try {
      await tonConnectUI.connectWallet();
      setWallet(tonConnectUI.wallet); // ✅ This is now defined
      console.log('Wallet connected:', tonConnectUI.wallet);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet. Try again.');
    }
  };
  // Function to handle button clicks
  const handleClick = (value) => {
    if (isGameStarted || !wallet) return; // Disable clicks when the game is started or wallet is not connected
    console.log(`Button clicked: ${value}`);
    const newChip = {
      id: Date.now(), // Unique ID for each chip
      position: getRandomPosition(), // Random position within the cell
      value: currentChipValue, // Store the chip value
    };
    setSelectedChips((prev) => ({
      ...prev,
      [value]: [...(prev[value] || []), newChip], // Add new chip to the cell
    }));
  };

  // Function to send TON tokens
  const sendTonTokens = async (amount) => {
    if (!wallet) {
      alert('Please connect your wallet first.');
      return;
    }

    const transaction = {
      messages: [
        {
          address: 'UQDpeRD6VmHoLuHt_vaXLbfVrIe2AfVX4iYtURxBkW4dlx0s', // Replace with your contract address
          amount: (amount * 1e6).toString(), // Amount in nanoton (1 TON = 1e9 nanoton)
        },
      ],
      validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
    };

    try {
      await tonConnectUI.sendTransaction(transaction);
      console.log('Transaction sent successfully');
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  // Function to handle Start Game button click
  const handleStartGame = async () => {
    if (!wallet) {
      alert('Please connect your wallet first.');
      return;
    }

    // Calculate total bet amount
    const totalBet = Object.values(selectedChips).reduce((sum, chips) => {
      return sum + chips.reduce((chipSum, chip) => chipSum + chip.value, 0);
    }, 0);

    // Send the bet amount to the contract
    await sendTonTokens(totalBet * 1e9); // Convert to nanoton

    // Generate a random winning number (0 to 36)
    const randomNumber = Math.floor(Math.random() * 37);
    setWinningNumber(randomNumber); // Set the winning number
    setIsGameStarted(true); // Trigger the transition

    // Check if the player won
    const selectedValues = Object.keys(selectedChips);
    let prizePool = 0;
    let hasWon = false;

    selectedValues.forEach((value) => {
      if (value === 'odd' && randomNumber % 2 !== 0 && randomNumber !== 0) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 2; // 2x payout for odd
      } else if (value === 'even' && randomNumber % 2 === 0 && randomNumber !== 0) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 2; // 2x payout for even
      } else if (value === 'red' && red_numbers.includes(randomNumber)) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 2; // 2x payout for red
      } else if (value === 'black' && !red_numbers.includes(randomNumber) && randomNumber !== 0) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 2; // 2x payout for black
      } else if (value === '1-12' && randomNumber >= 1 && randomNumber <= 12) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 3; // 3x payout for 1-12
      } else if (value === '13-24' && randomNumber >= 13 && randomNumber <= 24) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 3; // 3x payout for 13-24
      } else if (value === '25-36' && randomNumber >= 25 && randomNumber <= 36) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 3; // 3x payout for 25-36
      } else if (value === '1-18' && randomNumber >= 1 && randomNumber <= 18) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 2; // 2x payout for 1-18
      } else if (value === '19-36' && randomNumber >= 19 && randomNumber <= 36) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 2; // 2x payout for 19-36
      } else if (Number(value) === randomNumber) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 36; // 36x payout for exact number
      }
    });

    // Log the result
    if (hasWon) {
      console.log(`You won! Winning number: ${randomNumber}. Prize pool: $${prizePool}`);
      // Send the prize pool to the player's wallet
      await sendTonTokens(prizePool * 1e9); // Convert to nanoton
    } else {
      console.log(`You lost. Winning number: ${randomNumber}. Prize pool: $0`);
    }

    // Reset the game after 3 seconds
    setTimeout(() => {
      setIsGameStarted(false); // Re-enable clicks
      setSelectedChips({}); // Remove all chips
      setWinningNumber(null); // Clear the winning number
    }, 3000); // 3-second delay before resetting
  };

  return (
    <div className={`board ${isGameStarted ? 'game-started' : ''}`}>
      {/* Roulette Image */}
      <img
        src={RouletteImage}
        alt="Roulette"
        className={`roulette-image ${isGameStarted ? 'center' : ''}`}
      />

      {/* Wallet Connection Button */}
      <img
        src={TonWallet}
        alt="Connect Wallet"
        className="wallet-image"
        onClick={connectWallet}
      />

      {/* Display Wallet Address */}
      {wallet && (
        <p>Connected Wallet: {wallet.account.address}</p>
      )}

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
        <div className="lobby-name">Lobby Name</div>
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
      <button className="start-game-button" onClick={handleStartGame}>
        Start Game
      </button>
    </div>
  );
};

export default Board;