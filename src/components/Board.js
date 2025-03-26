import React, { useState, useRef, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import './Board.css';
import RouletteImage from './Roulette.png';
import TonWallet from './TonWallet.jpg';
import ClearImage from './Clear.png';
import UndoImage from './Undo.png';
import { Address } from '@ton/core';
import { Buffer } from 'buffer';

window.Buffer = Buffer;

const red_numbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const numbers = [
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
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

const chipValues = [1, 5, 10, 25, 50, 100];

const RouletteWheel = ({ winningNumber, isSpinning }) => {
  const wheelRef = useRef(null);
  const ballRef = useRef(null);
  const [ballPosition, setBallPosition] = useState(0);

  useEffect(() => {
    if (isSpinning) {
      // Reset ball position
      setBallPosition(0);

      // Spin wheel
      wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)';
      wheelRef.current.style.transform = 'rotate(1440deg)'; // 4 full rotations

      // Animate ball
      const ballAnimation = ballRef.current.animate(
        [
          { transform: 'translateX(0) rotate(0deg)', offset: 0 },
          { transform: 'translateX(50px) rotate(180deg)', offset: 0.25 },
          { transform: 'translateX(100px) rotate(360deg)', offset: 0.5 },
          { transform: 'translateX(50px) rotate(540deg)', offset: 0.75 },
          { transform: 'translateX(0) rotate(720deg)', offset: 1 }
        ],
        {
          duration: 4000,
          easing: 'cubic-bezier(0.1, 0.7, 0.1, 1)'
        }
      );

      // Calculate final ball position based on winning number
      const segmentAngle = 360 / 37;
      const finalBallPosition = (winningNumber * segmentAngle) + 180; // Offset by 180deg for better visual

      setTimeout(() => {
        wheelRef.current.style.transition = 'none';
        wheelRef.current.style.transform = `rotate(${-finalBallPosition}deg)`;
        setBallPosition(finalBallPosition);
      }, 4000);

      return () => {
        ballAnimation.cancel();
      };
    }
  }, [isSpinning, winningNumber]);

  return (
    <div className="roulette-container">
      <div className="roulette-wheel" ref={wheelRef}>
        {Array.from({ length: 37 }).map((_, i) => (
          <div
            key={i}
            className={`wheel-number ${i === 0 ? 'green' : red_numbers.includes(i) ? 'red' : 'black'}`}
            style={{ transform: `rotate(${i * (360/37)}deg)` }}
          >
            <span>{i}</span>
          </div>
        ))}
      </div>
      <div className="roulette-ball" ref={ballRef} style={{ transform: `rotate(${ballPosition}deg)` }} />
      <div className="roulette-pointer" />
    </div>
  );
};

const Board = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [selectedChips, setSelectedChips] = useState({});
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [winningNumber, setWinningNumber] = useState(null);
  const [currentChipValue, setCurrentChipValue] = useState(1);
  const [chipHistory, setChipHistory] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWheel, setShowWheel] = useState(false);

  const isRed = (number) => red_numbers.includes(number);

  const handleClick = (value, event) => {
    if (isGameStarted || !wallet) return;

    const rect = event.currentTarget.getBoundingClientRect();
    let x, y;

    if (rect.width >= 130) {
      x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)) - 5;
      y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)) - 20;
    }
    else if (rect.height >= 130) {
      x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)) - 20;
      y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)) - 5;
    }
    else {
      x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)) - 20;
      y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)) - 20;
    }

    const newChip = {
      id: Date.now(),
      position: { x, y },
      value: currentChipValue,
      cell: value,
    };

    setSelectedChips((prev) => ({
      ...prev,
      [value]: [...(prev[value] || []), newChip],
    }));

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
      const parsedAddress = Address.parse(address);
      const friendlyAddress = parsedAddress.toString();
      return `${friendlyAddress.slice(0, 5)}...${friendlyAddress.slice(-5)}`;
    } catch (e) {
      console.error("Error parsing address:", e);
      return `${address.slice(0, 5)}...${address.slice(-5)}`;
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

    updatedChips[lastAction.cell] = updatedChips[lastAction.cell].filter(
      (chip) => chip.id !== lastAction.chip.id
    );

    if (updatedChips[lastAction.cell].length === 0) {
      delete updatedChips[lastAction.cell];
    }

    setSelectedChips(updatedChips);
    setChipHistory((prev) => prev.slice(0, -1));
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
    setShowWheel(true);
    setIsSpinning(true);

    setTimeout(() => {
      setIsSpinning(false);
    }, 4000);

    setTimeout(() => {
      setShowWheel(false);
      setIsGameStarted(false);
      setSelectedChips({});
      setWinningNumber(null);
      setChipHistory([]);
    }, 7000);
  };

  return (
    <div className={`board ${isGameStarted ? 'game-started' : ''}`}>
      {showWheel && (
        <div className="roulette-overlay">
          <RouletteWheel winningNumber={winningNumber} isSpinning={isSpinning} />
        </div>
      )}

      <div className="roulette-header">
        <img src={RouletteImage} alt="Roulette" className="roulette-logo" />
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