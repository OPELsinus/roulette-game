import React, { useRef, useEffect, useState, useCallback } from 'react';
import './RouletteWheel.css';

// Standard European Roulette number sequence
const pocketNumbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];
const redNumbers = [32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3];
const blackNumbers = [15, 4, 2, 17, 6, 13, 11, 8, 10, 24, 33, 20, 31, 22, 29, 28, 35, 26];

const DIAMOND_COUNT = 8; // Number of diamond deflectors

const RouletteWheel = ({ isSpinning, onSpinComplete, setWinningNumberDisplay }) => {
  const canvasRef = useRef(null);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [ballAngle, setBallAngle] = useState(Math.random() * Math.PI * 2); // Initial random angle for ball
  const [ballRadius, setBallRadius] = useState(130); // Ball starts near the outer edge
  const [wheelVelocity, setWheelVelocity] = useState(0);
  const [ballVelocity, setBallVelocity] = useState(0);
  const [ballRadialVelocity, setBallRadialVelocity] = useState(0); // Velocity towards/away from center
  const [isBallFalling, setIsBallFalling] = useState(false);
  const [finalNumber, setFinalNumber] = useState(null);
  const animationFrameId = useRef(null);
  const pocketAngleRef = useRef(0); // To store the angle where the ball settled

  const canvasSize = 300;
  const center = canvasSize / 2;
  const wheelRadius = canvasSize / 2 - 10; // Outer radius of the number wheel
  const pocketRadius = wheelRadius - 25; // Radius where pockets are drawn
  const pocketInnerRadius = pocketRadius - 15; // Inner boundary of pockets
  const diamondRadius = pocketRadius + 10; // Radius where diamonds are placed

  // --- Drawing Functions ---

  const drawWheel = useCallback((ctx) => {
    const numPockets = pocketNumbers.length;
    const anglePerPocket = (Math.PI * 2) / numPockets;

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(wheelAngle); // Rotate the entire number wheel

    // Draw pocket segments
    for (let i = 0; i < numPockets; i++) {
      const startAngle = i * anglePerPocket - anglePerPocket / 2;
      const endAngle = startAngle + anglePerPocket;
      const number = pocketNumbers[i];

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, pocketRadius, startAngle, endAngle);
      ctx.closePath();

      if (number === 0) {
        ctx.fillStyle = '#008000'; // Green for 0
      } else if (redNumbers.includes(number)) {
        ctx.fillStyle = '#D00000'; // Red
      } else {
        ctx.fillStyle = '#000000'; // Black
      }
      ctx.fill();
      ctx.strokeStyle = '#E0E0E0'; // Pocket separators
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Draw numbers
      ctx.save();
      ctx.rotate(startAngle + anglePerPocket / 2); // Rotate to center of pocket
      ctx.translate(pocketRadius - 10, 0); // Move out to number position
      ctx.rotate(Math.PI / 2); // Orient number correctly
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(number.toString(), 0, 0);
      ctx.restore();
    }
    ctx.restore(); // Restore context before rotating wheel

    // Draw outer static ring (where ball initially spins)
    ctx.beginPath();
    ctx.arc(center, center, wheelRadius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#a1662f'; // Dark wood color
    ctx.lineWidth = 10;
    ctx.stroke();

    // Draw inner static ring
    ctx.beginPath();
    ctx.arc(center, center, pocketInnerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#c48a4f'; // Lighter wood color
    ctx.lineWidth = 5;
    ctx.stroke();

    // Draw center hub
    ctx.beginPath();
    ctx.arc(center, center, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700'; // Gold-like color
    ctx.fill();
    ctx.strokeStyle = '#b8860b'; // Darker gold
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw diamond deflectors (static relative to the outer ring)
    const anglePerDiamond = (Math.PI * 2) / DIAMOND_COUNT;
    for (let i = 0; i < DIAMOND_COUNT; i++) {
      const diamondAngle = i * anglePerDiamond;
      const dx = center + diamondRadius * Math.cos(diamondAngle);
      const dy = center + diamondRadius * Math.sin(diamondAngle);

      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(diamondAngle + Math.PI / 4); // Rotate diamond shape
      ctx.fillStyle = '#C0C0C0'; // Silver color
      ctx.strokeStyle = '#A0A0A0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(-3, -3, 6, 6); // Draw as a rotated square (diamond)
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

  }, [wheelAngle, center, wheelRadius, pocketRadius, pocketInnerRadius, diamondRadius]);

  const drawBall = useCallback((ctx) => {
    if (finalNumber !== null) {
      // Ball is settled in a pocket, rotate with the wheel
      const numPockets = pocketNumbers.length;
      const anglePerPocket = (Math.PI * 2) / numPockets;
      const settledAngle = pocketAngleRef.current + wheelAngle; // Add wheel's current rotation
      const ballX = center + (pocketRadius - 7) * Math.cos(settledAngle); // Place inside pocket area
      const ballY = center + (pocketRadius - 7) * Math.sin(settledAngle);

      ctx.beginPath();
      ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF'; // White ball
      ctx.fill();
      ctx.strokeStyle = '#808080'; // Grey outline
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (isSpinning || ballVelocity > 0.001) {
        // Ball is still moving
        const ballX = center + ballRadius * Math.cos(ballAngle);
        const ballY = center + ballRadius * Math.sin(ballAngle);

        ctx.beginPath();
        ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF'; // White ball
        ctx.fill();
        ctx.strokeStyle = '#808080'; // Grey outline
        ctx.lineWidth = 1;
        ctx.stroke();
    }
  }, [ballAngle, ballRadius, center, finalNumber, wheelAngle, pocketRadius, isSpinning, ballVelocity]);

  // --- Animation Logic ---

  const updatePhysics = useCallback(() => {
    let newWheelAngle = wheelAngle;
    let newBallAngle = ballAngle;
    let newBallRadius = ballRadius;
    let newWheelVelocity = wheelVelocity;
    let newBallVelocity = ballVelocity;
    let newBallRadialVelocity = ballRadialVelocity;
    let ballHasSettled = finalNumber !== null;

    if (ballHasSettled) {
      // Wheel is still slowing down, ball rotates with it
      newWheelVelocity *= 0.995; // Slower decay for wheel
      newWheelAngle += newWheelVelocity;
      if (Math.abs(newWheelVelocity) < 0.0001) {
        newWheelVelocity = 0; // Stop the wheel completely
        // Final number determination is already done when ball settles
      }
    } else if (isSpinning || newWheelVelocity > 0 || newBallVelocity > 0) {
      // Apply friction/decay
      newWheelVelocity *= 0.99; // Wheel slows down
      newBallVelocity *= 0.995; // Ball slows down slightly slower initially

      // Update angles
      newWheelAngle += newWheelVelocity;
      newBallAngle += newBallVelocity;

      // Ball physics: falling inwards and bouncing
      if (isBallFalling) {
        // Gravity effect (simplified) - accelerate towards center
        newBallRadialVelocity -= 0.05; // Increase speed towards center
        newBallRadius += newBallRadialVelocity; // Update radius based on radial velocity

        // Collision with diamonds
        if (newBallRadius <= diamondRadius + 3 && newBallRadius >= diamondRadius - 3) {
            // Check if angle aligns with a diamond position
            const anglePerDiamond = (Math.PI * 2) / DIAMOND_COUNT;
            for (let i = 0; i < DIAMOND_COUNT; i++) {
                const diamondAngle = i * anglePerDiamond;
                // Normalize angles for comparison
                const normalizedBallAngle = (newBallAngle % (Math.PI*2) + (Math.PI*2)) % (Math.PI*2);
                 if (Math.abs(normalizedBallAngle - diamondAngle) < anglePerDiamond / 4) { // Collision threshold
                      newBallRadialVelocity *= -0.5; // Bounce outwards slightly
                      newBallVelocity += (Math.random() - 0.5) * 0.02; // Add small random angular change
                      newBallRadius = diamondRadius + (newBallRadialVelocity > 0 ? 3 : -3); // Move slightly away
                      break; // Only handle one collision per frame
                 }
            }
        }


        // Check if ball enters pocket area
        if (newBallRadius < pocketRadius && newBallRadius > pocketInnerRadius) {
          // Ball has entered the pocket zone, determine winning number
          const numPockets = pocketNumbers.length;
          const anglePerPocket = (Math.PI * 2) / numPockets;

          // Angle relative to the wheel's current rotation
          const relativeAngle = (newBallAngle - newWheelAngle) % (Math.PI * 2);
          const positiveRelativeAngle = (relativeAngle + Math.PI * 2) % (Math.PI * 2);

          // Adjust for the offset of pocket 0
          const pocketIndexRaw = Math.floor(positiveRelativeAngle / anglePerPocket);

          // Correctly map index considering the pocket 0 offset and direction
           const finalPocketIndex = (numPockets - pocketIndexRaw) % numPockets;


          const winningNum = pocketNumbers[finalPocketIndex];
          setFinalNumber(winningNum); // Lock the number
          setWinningNumberDisplay(winningNum); // Show the number immediately
          ballHasSettled = true;

          // Store the angle relative to the wheel center where the ball settled
          pocketAngleRef.current = newBallAngle - newWheelAngle;


          // Stop independent ball motion
          newBallVelocity = 0;
          newBallRadialVelocity = 0;
          // Keep wheel velocity as is, it will slow down naturally
        }

        // Prevent ball from going through the center
        if (newBallRadius < pocketInnerRadius) {
           newBallRadius = pocketInnerRadius;
           newBallRadialVelocity *= -0.3; // Slight bounce back from inner ring
        }

      } else {
        // Ball is still spinning fast in the outer track
        // Start falling when ball speed drops below a threshold relative to wheel speed
        if (Math.abs(newBallVelocity) < Math.abs(newWheelVelocity) + 0.05 && newWheelVelocity > 0.01) { // Adjusted threshold
            setIsBallFalling(true);
            newBallRadialVelocity = -0.1; // Initial push towards center
        } else if (newWheelVelocity <= 0.01 && Math.abs(newBallVelocity) < 0.05) {
             // If wheel stopped early, force ball fall
             setIsBallFalling(true);
             newBallRadialVelocity = -0.1;
        }
      }

      // Stop condition
      if (ballHasSettled && newWheelVelocity === 0) {
        // Animation finished completely
        if (finalNumber !== null) {
             console.log("Final number determined by physics:", finalNumber);
             onSpinComplete(finalNumber); // Call callback with final number
        }
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
        return; // Exit update loop
      }
    } else {
       // Not spinning and velocities are zero
       cancelAnimationFrame(animationFrameId.current);
       animationFrameId.current = null;
       return; // Exit update loop
    }

    // Update state for next frame
    setWheelAngle(newWheelAngle);
    setBallAngle(newBallAngle);
    setBallRadius(newBallRadius);
    setWheelVelocity(newWheelVelocity);
    setBallVelocity(newBallVelocity);
    setBallRadialVelocity(newBallRadialVelocity);

    // Request next frame
    animationFrameId.current = requestAnimationFrame(updatePhysics);

  }, [
      isSpinning, wheelAngle, ballAngle, ballRadius, wheelVelocity, ballVelocity, ballRadialVelocity,
      isBallFalling, finalNumber, onSpinComplete, center, pocketRadius, pocketInnerRadius, diamondRadius, setWinningNumberDisplay
  ]);

  // --- useEffect Hooks ---

  // Effect to start/reset animation when isSpinning changes
  useEffect(() => {
    if (isSpinning) {
      console.log("Starting spin animation...");
      setFinalNumber(null); // Reset final number
      setWinningNumberDisplay(null); // Clear display
      setIsBallFalling(false); // Ball starts high
      setWheelAngle(Math.random() * Math.PI * 2); // Random start angle for wheel
      setBallAngle(Math.random() * Math.PI * 2); // Random start angle for ball
      setBallRadius(wheelRadius + 2); // Reset ball radius to outer track
      setWheelVelocity(0.1 + Math.random() * 0.05); // Initial wheel speed (spins one way) - Adjust speed here
      setBallVelocity(-0.15 - Math.random() * 0.08); // Initial ball speed (spins opposite way faster) - Adjust speed here
      setBallRadialVelocity(0); // No initial radial velocity

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      animationFrameId.current = requestAnimationFrame(updatePhysics);
    } else {
       // If isSpinning becomes false externally (e.g., game reset before animation ends)
       if (animationFrameId.current) {
           cancelAnimationFrame(animationFrameId.current);
           animationFrameId.current = null;
       }
       // Optionally reset states if needed when isSpinning turns false externally
       // setWheelVelocity(0);
       // setBallVelocity(0);
       // setFinalNumber(null); // Keep final number until next spin starts
    }

    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpinning]); // Dependency: only re-run when isSpinning changes


  // Effect for drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw elements
    drawWheel(context);
    drawBall(context);

    // No need for requestAnimationFrame here, physics loop handles updates
  }, [drawWheel, drawBall, wheelAngle, ballAngle, ballRadius, finalNumber]); // Re-draw when visual elements change


  return (
    <div className="roulette-wheel-container">
      <canvas ref={canvasRef} className="roulette-canvas"></canvas>
      {/* Display can be shown via parent state now */}
    </div>
  );
};

export default RouletteWheel;
Use code with caution.
JavaScript
3. Update Board.js to Integrate RouletteWheel:
import React, { useState, useEffect } from 'react'; // Added useEffect
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import './Board.css';
import RouletteImage from './Roulette.png';
import TonWalletImage from './TonWallet.jpg'; // Renamed for clarity
import ClearImage from './Clear.png';
import UndoImage from './Undo.png';
import RouletteWheel from './RouletteWheel'; // Import the new component
import './RouletteWheel.css'; // Import the wheel's CSS

// Keep existing constants: red_numbers, numbers, specialButtons, chipValues

const Board = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [selectedChips, setSelectedChips] = useState({});
  // const [isGameStarted, setIsGameStarted] = useState(false); // Replaced by isSpinning
  const [winningNumber, setWinningNumber] = useState(null); // Actual final number
  const [winningNumberDisplay, setWinningNumberDisplay] = useState(null); // For display during spin
  const [currentChipValue, setCurrentChipValue] = useState(1);
  const [chipHistory, setChipHistory] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false); // Controls the wheel animation
  const [gameMessage, setGameMessage] = useState(''); // To show win/loss message

  const isRed = (number) => red_numbers.includes(number);

  const handleClick = (value, event) => {
    // Prevent placing bets while spinning or if wallet not connected
    if (isSpinning || !wallet) return;

    const rect = event.currentTarget.getBoundingClientRect();
    let x, y;

    // Keep existing chip placement logic...
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

  // connectWallet, disconnectWallet, formatAddress remain the same...
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
    return `Wallet Connected`; // Simplified display
  };


  const handleClear = () => {
    if (isSpinning) return; // Don't clear while spinning
    setSelectedChips({});
    setChipHistory([]);
  };

  const handleUndo = () => {
    if (isSpinning || chipHistory.length === 0) return; // Don't undo while spinning

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

  // sendTonTokens remains the same (consider adjusting amount logic if needed)
  const sendTonTokens = async (nanoTonAmount) => {
    if (!wallet) {
      alert('Please connect your wallet first.');
      return false; // Indicate failure
    }

    // Ensure amount is a positive integer string
    const amountStr = BigInt(nanoTonAmount).toString();
    if (BigInt(amountStr) <= 0) {
        console.error('Invalid amount for transaction:', amountStr);
        alert('Bet amount must be positive.');
        return false;
    }


    const transaction = {
      messages: [
        {
          address: 'UQDpeRD6VmHoLuHt_vaXLbfVrIe2AfVX4iYtURxBkW4dlx0s', // Your destination address
          amount: amountStr, // Amount in nanotons
        },
      ],
      validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes validity
    };

    try {
      const result = await tonConnectUI.sendTransaction(transaction);
      console.log('Transaction sent successfully:', result);
      // Note: You might want to wait for blockchain confirmation here in a real dApp
      return true; // Indicate success
    } catch (error) {
      console.error('Transaction failed:', error);
      // Handle specific error types if possible (e.g., UserRejectedError)
      alert(`Transaction failed: ${error.message || 'Unknown error'}`);
      return false; // Indicate failure
    }
  };


  const calculateWinnings = (finalNumber) => {
    const selectedValues = Object.keys(selectedChips);
    let prizePool = 0;
    let hasWon = false;
    const numToCheck = Number(finalNumber); // Ensure it's a number

    console.log(`Calculating winnings for number: ${numToCheck}`);
    console.log("Bets placed:", selectedChips);


    selectedValues.forEach((value) => {
      const betAmountOnValue = selectedChips[value].reduce((sum, chip) => sum + chip.value, 0);
       let multiplier = 0;
       let wonOnThisValue = false;

      if (value === 'odd' && numToCheck % 2 !== 0 && numToCheck !== 0) {
         multiplier = 2; wonOnThisValue = true;
      } else if (value === 'even' && numToCheck % 2 === 0 && numToCheck !== 0) {
         multiplier = 2; wonOnThisValue = true;
      } else if (value === 'red' && red_numbers.includes(numToCheck)) {
         multiplier = 2; wonOnThisValue = true;
      } else if (value === 'black' && !red_numbers.includes(numToCheck) && numToCheck !== 0) {
         multiplier = 2; wonOnThisValue = true;
      } else if (value === '1-12' && numToCheck >= 1 && numToCheck <= 12) {
         multiplier = 3; wonOnThisValue = true;
      } else if (value === '13-24' && numToCheck >= 13 && numToCheck <= 24) {
         multiplier = 3; wonOnThisValue = true;
      } else if (value === '25-36' && numToCheck >= 25 && numToCheck <= 36) {
         multiplier = 3; wonOnThisValue = true;
      } else if (value === '1-18' && numToCheck >= 1 && numToCheck <= 18) {
         multiplier = 2; wonOnThisValue = true;
      } else if (value === '19-36' && numToCheck >= 19 && numToCheck <= 36) {
         multiplier = 2; wonOnThisValue = true;
      } else if (Number(value) === numToCheck) {
         // Direct number hit
         multiplier = 36; wonOnThisValue = true;
      }

      if (wonOnThisValue) {
          hasWon = true;
          prizePool += betAmountOnValue * multiplier;
           console.log(`Won on ${value}! Bet: $${betAmountOnValue}, Multiplier: ${multiplier}, Added to prize: $${betAmountOnValue * multiplier}`);
      }
    });

    return { hasWon, prizePool };
  };


  const handleStartGame = async () => {
    if (!wallet) {
      alert('Please connect your wallet first.');
      return;
    }
    if (Object.keys(selectedChips).length === 0) {
      alert('Please place your bets first.');
      return;
    }
    if (isSpinning) {
      return; // Don't start if already spinning
    }

    const totalBet = Object.values(selectedChips).reduce((sum, chips) => {
      return sum + chips.reduce((chipSum, chip) => chipSum + chip.value, 0);
    }, 0);

    if (totalBet <= 0) {
        alert('Total bet must be positive.');
        return;
    }

    console.log(`Starting game. Total bet: $${totalBet}`);

    // --- Transaction FIRST ---
    // Convert bet value (e.g., dollars/credits) to nanotons.
    // !! IMPORTANT: Define your conversion rate carefully!
    // Example: 1 unit of bet = 0.01 TON = 10,000,000 nanotons
    const nanoTonBetAmount = BigInt(totalBet) * BigInt(10_000_000); // 0.01 TON per unit

    setGameMessage('Sending transaction...');
    const transactionSent = await sendTonTokens(nanoTonBetAmount);

    if (!transactionSent) {
       setGameMessage('Transaction failed or cancelled. Cannot start game.');
       // Optional: Clear message after a delay
       setTimeout(() => setGameMessage(''), 3000);
       return; // Stop if transaction failed
    }

    // --- Start Animation AFTER successful transaction ---
    setGameMessage(''); // Clear transaction message
    setWinningNumber(null); // Clear previous winning number
    setWinningNumberDisplay(null); // Clear display number
    setIsSpinning(true); // Trigger the animation

    // The rest of the logic (calculating winnings, sending prize)
    // will happen in handleSpinComplete triggered by the RouletteWheel component.
  };

  // Callback function for when the wheel animation finishes
  const handleSpinComplete = async (finalNumber) => {
    console.log(`Animation complete. Winning Number: ${finalNumber}`);
    setWinningNumber(finalNumber); // Set the final winning number state
    setIsSpinning(false); // Animation is done

    const { hasWon, prizePool } = calculateWinnings(finalNumber);

    if (hasWon) {
      setGameMessage(`Winning Number: ${finalNumber}! You won $${prizePool}!`);
      console.log(`You won! Prize pool: $${prizePool}`);

      // --- Send Winnings ---
      // !! IMPORTANT: Convert prize value to nanotons using the SAME rate or your defined logic.
      const nanoTonPrizeAmount = BigInt(prizePool) * BigInt(10_000_000); // Example conversion
      console.log(`Attempting to send winnings: ${nanoTonPrizeAmount} nanotons`);

      // In a real scenario, this transaction would come FROM the game's treasury wallet TO the user's wallet.
      // For now, we'll simulate by sending *from* the user again, which doesn't make sense financially
      // but demonstrates the flow. Replace with backend logic later.
      // alert(`Simulating sending prize of ${prizePool} ( ${nanoTonPrizeAmount} nanotons)`);
      // await sendTonTokens(nanoTonPrizeAmount); // This needs server-side logic

    } else {
      setGameMessage(`Winning Number: ${finalNumber}. Better luck next time!`);
      console.log(`You lost. Winning number: ${finalNumber}.`);
    }

    // Reset board after a delay
    setTimeout(() => {
      setSelectedChips({});
      setChipHistory([]);
      setGameMessage(''); // Clear win/loss message
      setWinningNumberDisplay(null); // Clear the number display visually
    }, 5000); // Increased delay to show message longer
  };


  return (
    // Added class to disable clicks while spinning
    <div className={`board ${isSpinning ? 'game-started spinning' : ''}`}>
      <div className="roulette-header">
        {/* Keep header structure */}
        <img src={RouletteImage} alt="Roulette Logo" className="roulette-logo-image" />
         {wallet ? (
           <div className="wallet-info">
             <span className="wallet-address">
               {formatAddress(wallet.account.address)} {/* Pass address directly */}
             </span>
             <button className="disconnect-button" onClick={disconnectWallet}>
               Disconnect
             </button>
           </div>
         ) : (
           <img
             src={TonWalletImage}
             alt="Connect Wallet"
             className="wallet-image"
             onClick={connectWallet}
           />
         )}
      </div>

      {/* Display Game Messages (like sending transaction, win/loss) */}
      {gameMessage && <div className="game-message">{gameMessage}</div>}


      {/* Integrate Roulette Wheel */}
      <div className="roulette-wheel-section">
        <RouletteWheel
          isSpinning={isSpinning}
          onSpinComplete={handleSpinComplete}
          setWinningNumberDisplay={setWinningNumberDisplay} // Pass setter for display
        />
         {/* Display Winning Number prominently during/after spin */}
         {winningNumberDisplay !== null && (
           <div className="winning-number-display">
             <p>Number:</p>
             <p>{winningNumberDisplay}</p>
           </div>
         )}
      </div>


      {/* Chip Selector */}
      <div className="chip-value-selector">
        <p>Select Chip Value:</p>
        {chipValues.map((value) => (
          <button
            key={value}
            // Disable chip selection while spinning
            disabled={isSpinning}
            className={`chip-value-button ${currentChipValue === value ? 'active' : ''}`}
            onClick={() => !isSpinning && setCurrentChipValue(value)}
          >
            ${value}
          </button>
        ))}
      </div>

      {/* Betting Area */}
      <div className="betting-area">
        <div className="zero-row">
           {/* Make cell clickable via handleClick */}
            <div className={`cell zero ${selectedChips[0]?.length ? 'has-chips' : ''}`} onClick={(e) => handleClick(0, e)}>
                0
                {selectedChips[0]?.map((chip) => (
                 <div
                   key={chip.id}
                   className="chip"
                   style={{
                     left: `${chip.position.x}%`,
                     top: `${chip.position.y}%`,
                     backgroundColor: `var(--chip-${chip.value})` // Use CSS variables for chip colors
                   }}
                   title={`$${chip.value}`} // Show value on hover
                 >
                   ${chip.value}
                 </div>
               ))}
            </div>

          <div className="action-buttons">
            <img
              src={ClearImage}
              alt="Clear Bets"
              className={`action-button ${isSpinning ? 'disabled' : ''}`}
              onClick={handleClear}
              title="Clear All Bets"
            />
            <img
              src={UndoImage}
              alt="Undo Last Bet"
              className={`action-button ${isSpinning ? 'disabled' : ''}`}
              onClick={handleUndo}
              title="Undo Last Bet"
            />
          </div>
        </div>

        <div className="main-grid">
           {/* Render number columns */}
           <div className="number-columns">
             {numbers.map((column, colIndex) => (
               <div key={colIndex} className="column">
                 {column.map((number) => (
                   <div
                     key={number}
                     // Add 'has-chips' class if chips exist
                     className={`cell number ${isRed(number) ? 'red' : 'black'} ${selectedChips[number]?.length ? 'has-chips' : ''}`}
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
                           backgroundColor: `var(--chip-${chip.value})`
                         }}
                          title={`$${chip.value}`}
                       >
                         ${chip.value}
                       </div>
                     ))}
                   </div>
                 ))}
               </div>
             ))}
           </div>

            {/* Render special bet columns */}
            <div className="special-columns">
               {/* Column 1-12, 13-24, 25-36 */}
              <div className="column">
                 {specialButtons.slice(0, 3).map((button) => (
                     <div
                         key={button.value}
                         className={`cell special ${selectedChips[button.value]?.length ? 'has-chips' : ''}`}
                         onClick={(e) => handleClick(button.value, e)}
                     >
                         {button.label}
                          {selectedChips[button.value]?.map((chip) => (
                              <div key={chip.id} className="chip" style={{ left: `${chip.position.x}%`, top: `${chip.position.y}%`, backgroundColor: `var(--chip-${chip.value})` }} title={`$${chip.value}`}>
                                 ${chip.value}
                             </div>
                         ))}
                     </div>
                 ))}
             </div>
               {/* Column Odd, Even */}
              <div className="column">
                  {specialButtons.slice(3, 5).map((button) => (
                     <div
                         key={button.value}
                          className={`cell special ${selectedChips[button.value]?.length ? 'has-chips' : ''}`}
                         onClick={(e) => handleClick(button.value, e)}
                     >
                         {button.label}
                          {selectedChips[button.value]?.map((chip) => (
                              <div key={chip.id} className="chip" style={{ left: `${chip.position.x}%`, top: `${chip.position.y}%`, backgroundColor: `var(--chip-${chip.value})` }} title={`$${chip.value}`}>
                                 ${chip.value}
                             </div>
                         ))}
                     </div>
                 ))}
             </div>
              {/* Column 1-18, Red, Black, 19-36 */}
             <div className="column">
                 {/* Need to map specific indices carefully */}
                 {[specialButtons[5], specialButtons[6], specialButtons[7], specialButtons[8]].map((button) => (
                      <div
                         key={button.value}
                          className={`cell special ${button.value === 'red' ? 'red-bg' : button.value === 'black' ? 'black-bg' : ''} ${selectedChips[button.value]?.length ? 'has-chips' : ''}`}
                         onClick={(e) => handleClick(button.value, e)}
                      >
                         {button.label}
                         {selectedChips[button.value]?.map((chip) => (
                             <div key={chip.id} className="chip" style={{ left: `${chip.position.x}%`, top: `${chip.position.y}%`, backgroundColor: `var(--chip-${chip.value})` }} title={`$${chip.value}`}>
                                 ${chip.value}
                             </div>
                         ))}
                      </div>
                  ))}
             </div>
           </div>
        </div>
      </div>


      <button
        className="start-game-button"
        onClick={handleStartGame}
        disabled={isSpinning || Object.keys(selectedChips).length === 0 || !wallet} // Disable when spinning, no bets, or no wallet
      >
        {isSpinning ? 'Spinning...' : 'Place Bets & Spin'}
      </button>
    </div>
  );
};

export default Board;