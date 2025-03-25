import React, { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import './Board.css';
import RouletteImage from './Roulette.png';
import TonWallet from './TonWallet.jpg';
import ClearImage from './Clear.png'; // Add a clear image
import UndoImage from './Undo.png'; // Add an undo image
import { Address } from '@ton/core';
import { Buffer } from 'buffer';

gglobalThis.Buffer = Buffer; // Make Buffer available globally

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
  const [selectedChips, setSelectedChips] = useState({});
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [winningNumber, setWinningNumber] = useState(null);
  const [currentChipValue, setCurrentChipValue] = useState(1);
  const [chipHistory, setChipHistory] = useState([]); // To track chip history for undo

  const isRed = (number) => red_numbers.includes(number);

  const handleClick = (value, event) => {
    if (isGameStarted || !wallet) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)) - 20; // Ensure x is within 0-100%
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)) - 20; // Ensure y is within 0-100%

    const newChip = {
      id: Date.now(),
      position: { x, y },
      value: currentChipValue,
      cell: value, // Track which cell the chip belongs to
    };

    setSelectedChips((prev) => ({
      ...prev,
      [value]: [...(prev[value] || []), newChip],
    }));

    // Update chip history for undo functionality
    setChipHistory((prev) => [...prev, { cell: value, chip: newChip }]);
  };

  const connectWallet = async () => {
    try {
      await tonConnectUI.connectWallet();
    } catch (error) {
      console.error("Wallet connection failed:", error);
      alert("Failed to connect wallet. Try again.");
    }
  };

  const disconnectWallet = async () => {
    try {
      await tonConnectUI.disconnect();
    } catch (error) {
      console.error("Wallet disconnection failed:", error);
    }
  };

  const formatAddress = (address) => {
      if (!address) return '';

      try {
        // Parse the address (works for both raw and friendly formats)
        const parsedAddress = Address.parse(address);

        // Convert to user-friendly format (UQ... or EQ...)
        const friendlyAddress = parsedAddress.toString();

        // Shorten to first 5 + last 5 chars
        return `${friendlyAddress.slice(0, 5)}...${friendlyAddress.slice(-5)}`;
      } catch (e) {
        console.error("Error parsing address:", e);
        return `${address.slice(0, 5)}...${address.slice(-5)}`; // Fallback
      }
    };

  const handleClear = () => {
    setSelectedChips({});
    setChipHistory([]);
  };

  const handleUndo = () => {
    if (chipHistory.length === 0) return;

    const lastAction = chipHistory[chipHistory.length - 1];
    const updatedChips = { ...selectedChips };

    // Remove the last chip from the cell
    updatedChips[lastAction.cell] = updatedChips[lastAction.cell].filter(
      (chip) => chip.id !== lastAction.chip.id
    );

    // If the cell is empty, remove it from the object
    if (updatedChips[lastAction.cell].length === 0) {
      delete updatedChips[lastAction.cell];
    }

    setSelectedChips(updatedChips);
    setChipHistory((prev) => prev.slice(0, -1)); // Remove the last action from history
  };

  const sendTonTokens = async (amount) => {
    if (!wallet) {
      alert('Please connect your wallet first.');
      return;
    }

    const transaction = {
      messages: [
        {
          address: 'UQDpeRD6VmHoLuHt_vaXLbfVrIe2AfVX4iYtURxBkW4dlx0s',
          amount: (amount * 1e6).toString(),
        },
      ],
      validUntil: Math.floor(Date.now() / 1000) + 300,
    };

    try {
      await tonConnectUI.sendTransaction(transaction);
      console.log('Transaction sent successfully');
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  const handleStartGame = async () => {
    if (!wallet) {
      alert('Please connect your wallet first.');
      return;
    }

    const totalBet = Object.values(selectedChips).reduce((sum, chips) => {
      return sum + chips.reduce((chipSum, chip) => chipSum + chip.value, 0);
    }, 0);

    await sendTonTokens(totalBet * 1e9);

    const randomNumber = Math.floor(Math.random() * 37);
    setWinningNumber(randomNumber);
    setIsGameStarted(true);

    const selectedValues = Object.keys(selectedChips);
    let prizePool = 0;
    let hasWon = false;

    selectedValues.forEach((value) => {
      if (value === 'odd' && randomNumber % 2 !== 0 && randomNumber !== 0) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 2;
      } else if (value === 'even' && randomNumber % 2 === 0 && randomNumber !== 0) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 2;
      } else if (value === 'red' && red_numbers.includes(randomNumber)) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 2;
      } else if (value === 'black' && !red_numbers.includes(randomNumber) && randomNumber !== 0) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 2;
      } else if (value === '1-12' && randomNumber >= 1 && randomNumber <= 12) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 3;
      } else if (value === '13-24' && randomNumber >= 13 && randomNumber <= 24) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 3;
      } else if (value === '25-36' && randomNumber >= 25 && randomNumber <= 36) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 3;
      } else if (value === '1-18' && randomNumber >= 1 && randomNumber <= 18) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 2;
      } else if (value === '19-36' && randomNumber >= 19 && randomNumber <= 36) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 2;
      } else if (Number(value) === randomNumber) {
        hasWon = true;
        prizePool += selectedChips[value].reduce((sum, chip) => sum + chip.value, 0) * 36;
      }
    });

    if (hasWon) {
      console.log(`You won! Winning number: ${randomNumber}. Prize pool: $${prizePool}`);
      await sendTonTokens(prizePool * 1e9);
    } else {
      console.log(`You lost. Winning number: ${randomNumber}. Prize pool: $0`);
    }

    setTimeout(() => {
      setIsGameStarted(false);
      setSelectedChips({});
      setWinningNumber(null);
      setChipHistory([]); // Clear chip history after game ends
    }, 3000);
  };

  return (
    <div className={`board ${isGameStarted ? 'game-started' : ''}`}>
      <div className="roulette-header">
        <img src={RouletteImage} alt="Roulette" className="roulette-image" />
        {wallet ? (
          <div className="wallet-info">
            <span className="wallet-address">
              {formatAddress(wallet.account.address.toString())}
            </span>
            <button className="disconnect-button" onClick={disconnectWallet}>
              Disconnect
            </button>
          </div>
        ) : (
          <img
            src={TonWallet}
            alt="Connect Wallet"
            className="wallet-image"
            onClick={connectWallet}
          />
        )}
      </div>

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

      <div className="zero-row">
        <div className="cell zero" onClick={(e) => handleClick(0, e)}>
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
              ${chip.value}
            </div>
          ))}
        </div>
        <div className="action-buttons">
          <img
            src={ClearImage}
            alt="Clear"
            className="action-button"
            onClick={handleClear}
          />
          <img
            src={UndoImage}
            alt="Undo"
            className="action-button"
            onClick={handleUndo}
          />
        </div>
      </div>

      <div className="main-grid">
        <div className="number-columns">
          {numbers.map((column, colIndex) => (
            <div key={colIndex} className="column">
              {column.map((number) => (
                <div
                  key={number}
                  className={`cell number ${isRed(number) ? 'red' : 'black'}`}
                  onClick={(e) => handleClick(number, e)}
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
                      ${chip.value}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="special-columns">
          <div className="column">
            {specialButtons.slice(0, 3).map((button, index) => (
              <div
                key={index}
                className="cell special"
                onClick={(e) => handleClick(button.value, e)}
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
                    ${chip.value}
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
                onClick={(e) => handleClick(button.value, e)}
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
                    ${chip.value}
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
                onClick={(e) => handleClick(button.value, e)}
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
                    ${chip.value}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="start-game-button" onClick={handleStartGame}>
        Start Game
      </button>
    </div>
  );
};

export default Board;