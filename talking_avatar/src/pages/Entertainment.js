import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebaseConfig'; // Adjust path to your firebase config file
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FaTimes, FaRedo, FaTrophy, FaVolumeUp } from 'react-icons/fa';

// Import Google Fonts for a playful look
const googleFontsLink = (
    <link
        href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap"
        rel="stylesheet"
    />
);

const Entertainment = () => {
    const [userId, setUserId] = useState(null);
    const [scores, setScores] = useState({ memoryMatch: 0, wordScramble: 0, picturePuzzle: 0, ticTacToe: 0 });
    const [selectedGame, setSelectedGame] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Fetch user data and scores from Firestore
    useEffect(() => {
        const fetchUserData = async () => {
            const userIdFromStorage = localStorage.getItem('userId');
            const sessionExpiry = localStorage.getItem('sessionExpiry');

            if (!userIdFromStorage || !sessionExpiry || new Date(sessionExpiry) < new Date()) {
                console.error('Session expired or invalid user ID');
                return;
            }

            setUserId(userIdFromStorage);

            try {
                const userDocRef = doc(db, 'users', userIdFromStorage);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userScores = userDoc.data().gameScores || { memoryMatch: 0, wordScramble: 0, picturePuzzle: 0, ticTacToe: 0 };
                    setScores(userScores);
                } else {
                    await setDoc(userDocRef, { gameScores: { memoryMatch: 0, wordScramble: 0, picturePuzzle: 0, ticTacToe: 0 } });
                    setScores({ memoryMatch: 0, wordScramble: 0, picturePuzzle: 0, ticTacToe: 0 });
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };
        fetchUserData();
    }, []);

    // Save score to Firestore
    const saveScore = async (game, newScore) => {
        if (!userId) return;

        const updatedScores = { ...scores, [game]: newScore };
        setScores(updatedScores);

        try {
            const userDocRef = doc(db, 'users', userId);
            await setDoc(userDocRef, { gameScores: updatedScores }, { merge: true });
            console.log(`Score for ${game} updated successfully: ${newScore}`);
        } catch (error) {
            console.error(`Error updating score for ${game}:`, error);
        }
    };

    // Speech function for instructions
    const speakInstructions = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
    };

    // Open and close modal
    const openModal = (game) => {
        setSelectedGame(game);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedGame(null);
    };

    // Game 1: Memory Match (10 cards, 5 pairs, 60-second timer)
    const MemoryMatch = () => {
        const [cards, setCards] = useState([]);
        const [flipped, setFlipped] = useState([]);
        const [matched, setMatched] = useState([]);
        const [score, setScore] = useState(0);
        const [timer, setTimer] = useState(60);
        const [isGameOver, setIsGameOver] = useState(false);

        const emojis = ['😺', '🐶', '🐻', '🦁', '🐼', '🐨', '🦊', '🐰', '🐯', '🦒'];
        const totalPairs = 5; // 5 pairs = 10 cards

        const initializeGame = () => {
            const selectedEmojis = emojis.slice(0, totalPairs);
            const gameCards = [...selectedEmojis, ...selectedEmojis]
                .sort(() => Math.random() - 0.5)
                .map((emoji, index) => ({ id: index, emoji, isFlipped: false }));
            setCards(gameCards);
            setFlipped([]);
            setMatched([]);
            setScore(0);
            setTimer(60);
            setIsGameOver(false);
        };

        useEffect(() => {
            initializeGame();
        }, []);

        useEffect(() => {
            if (timer > 0 && !isGameOver) {
                const interval = setInterval(() => {
                    setTimer((prev) => prev - 1);
                }, 1000);
                return () => clearInterval(interval);
            } else if (timer === 0) {
                setIsGameOver(true);
                saveScore('memoryMatch', Math.max(scores.memoryMatch, score));
            }
        }, [timer, isGameOver]);

        const handleCardClick = (id) => {
            if (isGameOver || flipped.length === 2 || matched.includes(id)) return;

            const newFlipped = [...flipped, id];
            setFlipped(newFlipped);

            if (newFlipped.length === 2) {
                const [firstId, secondId] = newFlipped;
                if (cards[firstId].emoji === cards[secondId].emoji) {
                    setMatched([...matched, firstId, secondId]);
                    const newScore = score + 10;
                    setScore(newScore);
                    if (matched.length + 2 === cards.length) {
                        setIsGameOver(true);
                        saveScore('memoryMatch', Math.max(scores.memoryMatch, newScore));
                    }
                }
                setTimeout(() => setFlipped([]), 1000);
            }
        };

        const handleInstructions = () => {
            speakInstructions(
                'Welcome to Memory Match! You have 60 seconds to match all 5 pairs of emojis. Tap on two cards to flip them. If they match, they stay flipped. If not, they flip back. Try to match all pairs before the time runs out!'
            );
        };

        return (
            <div className="p-4">
                <h3 className="text-xl font-medium text-[#5D4037] mb-2 font-comic-neue">Memory Match 🧠</h3>
                <p className="text-lg text-[#5D4037] mb-2 font-comic-neue">Score: {score} 🎯 | Time: {timer}s ⏳</p>
                <button
                    onClick={handleInstructions}
                    className="bg-[#FFCCBC] text-[#5D4037] p-2 rounded-lg mb-2 flex items-center gap-1 mx-auto shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                    <FaVolumeUp /> Play Instructions
                </button>
                {isGameOver ? (
                    <div className="text-center">
                        <p className="text-lg text-[#388E3C] font-comic-neue mb-2">
                            {matched.length === cards.length ? 'You Win! 🎉' : 'Time’s Up! Try Again! 😊'}
                        </p>
                        <button
                            onClick={initializeGame}
                            className="bg-gradient-to-r from-[#B2DFDB] to-[#80CBC4] text-[#00695C] p-3 rounded-xl text-lg font-medium flex items-center gap-1 mx-auto shadow-md hover:shadow-lg transition-shadow duration-300"
                        >
                            <FaRedo /> Play Again
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-5 gap-2">
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                onClick={() => handleCardClick(card.id)}
                                className={`bg-[#FFF5F5] p-3 rounded-lg shadow-md text-2xl text-center cursor-pointer transition-transform duration-300 ${flipped.includes(card.id) || matched.includes(card.id) ? 'bg-[#C8E6C9]' : ''
                                    }`}
                            >
                                {flipped.includes(card.id) || matched.includes(card.id) ? card.emoji : '❓'}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Game 2: Word Scramble (4-6 letter words, hint system)
    const WordScramble = () => {
        const [word, setWord] = useState('');
        const [scrambled, setScrambled] = useState([]);
        const [currentOrder, setCurrentOrder] = useState([]);
        const [score, setScore] = useState(0);
        const [message, setMessage] = useState('');
        const [hint, setHint] = useState('');
        const [hintTimer, setHintTimer] = useState(10);

        const words = ['APPLE', 'HOUSE', 'SMILE', 'RIVER', 'CLOUD', 'FRIEND'];

        const initializeGame = () => {
            const newWord = words[Math.floor(Math.random() * words.length)];
            const scrambledWord = newWord.split('').sort(() => Math.random() - 0.5);
            setWord(newWord);
            setScrambled(scrambledWord);
            setCurrentOrder(scrambledWord);
            setMessage('');
            setHint('');
            setHintTimer(10);
        };

        useEffect(() => {
            initializeGame();
        }, []);

        useEffect(() => {
            if (hintTimer > 0) {
                const interval = setInterval(() => {
                    setHintTimer((prev) => prev - 1);
                }, 1000);
                return () => clearInterval(interval);
            } else if (hintTimer === 0 && !hint) {
                setHint(`Hint: The first letter is ${word[0]}`);
            }
        }, [hintTimer, hint, word]);

        const handleDragStart = (e, index) => {
            e.dataTransfer.setData('letterIndex', index);
        };

        const handleDrop = (e, targetIndex) => {
            const draggedIndex = parseInt(e.dataTransfer.getData('letterIndex'));
            const newOrder = [...currentOrder];
            [newOrder[draggedIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[draggedIndex]];
            setCurrentOrder(newOrder);

            if (newOrder.join('') === word) {
                const newScore = score + 15;
                setScore(newScore);
                setMessage('Correct! 🎉');
                saveScore('wordScramble', Math.max(scores.wordScramble, newScore));
                setTimeout(() => initializeGame(), 1500);
            }
        };

        const handleDragOver = (e) => {
            e.preventDefault();
        };

        const handleInstructions = () => {
            speakInstructions(
                'Welcome to Word Scramble! You will see a mixed-up word. Drag the letters to put them in the correct order. For example, if the letters are A-P-P-L-E scrambled, you need to make the word APPLE. A hint will appear after 10 seconds if you need help. Good luck!'
            );
        };

        return (
            <div className="p-4">
                <h3 className="text-xl font-medium text-[#5D4037] mb-2 font-comic-neue">Word Scramble 📝</h3>
                <p className="text-lg text-[#5D4037] mb-2 font-comic-neue">Score: {score} 🎯</p>
                <button
                    onClick={handleInstructions}
                    className="bg-[#FFCCBC] text-[#5D4037] p-2 rounded-lg mb-2 flex items-center gap-1 mx-auto shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                    <FaVolumeUp /> Play Instructions
                </button>
                <p className="text-lg text-[#5D4037] mb-2 font-comic-neue">Unscramble the word:</p>
                <div className="flex justify-center gap-2 mb-4">
                    {currentOrder.map((letter, index) => (
                        <div
                            key={index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragOver={handleDragOver}
                            className="bg-[#FFF5F5] p-3 rounded-lg shadow-md text-2xl text-[#5D4037] font-comic-neue touch-action-none"
                        >
                            {letter}
                        </div>
                    ))}
                </div>
                {hint && <p className="text-lg text-[#388E3C] mb-2 font-comic-neue">{hint}</p>}
                {hintTimer > 0 && (
                    <p className="text-sm text-[#5D4037] mb-2 font-comic-neue">Hint in {hintTimer}s...</p>
                )}
                {message && (
                    <p className="text-lg text-[#388E3C] mt-2 font-comic-neue text-center">{message}</p>
                )}
                <button
                    onClick={initializeGame}
                    className="mt-4 bg-gradient-to-r from-[#B2DFDB] to-[#80CBC4] text-[#00695C] p-3 rounded-xl text-lg font-medium flex items-center gap-1 mx-auto shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                    <FaRedo /> New Word
                </button>
            </div>
        );
    };

    // Game 3: Picture Puzzle (4x4 grid, 90-second timer)
    const PicturePuzzle = () => {
        const [tiles, setTiles] = useState([]);
        const [score, setScore] = useState(0);
        const [timer, setTimer] = useState(90);
        const [isGameOver, setIsGameOver] = useState(false);

        const images = [
            'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300', // Dog
            'https://images.pexels.com/photos/674010/pexels-photo-674010.jpeg?auto=compress&cs=tinysrgb&w=300', // Flower
            'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=300', // Cat
        ];

        const initializeGame = () => {
            const image = images[Math.floor(Math.random() * images.length)];
            const correctOrder = Array.from({ length: 16 }, (_, i) => ({
                id: i,
                position: i,
                image: image,
                part: i,
            }));
            const shuffledOrder = [...correctOrder].sort(() => Math.random() - 0.5);
            setTiles(shuffledOrder);
            setTimer(90);
            setIsGameOver(false);
        };

        useEffect(() => {
            initializeGame();
        }, []);

        useEffect(() => {
            if (timer > 0 && !isGameOver) {
                const interval = setInterval(() => {
                    setTimer((prev) => prev - 1);
                }, 1000);
                return () => clearInterval(interval);
            } else if (timer === 0) {
                setIsGameOver(true);
                saveScore('picturePuzzle', Math.max(scores.picturePuzzle, score));
            }
        }, [timer, isGameOver]);

        const handleTileClick = (index) => {
            if (isGameOver) return;

            const emptyTileIndex = tiles.findIndex((tile) => tile.part === 15); // Last tile is "empty"
            const clickedTileIndex = index;

            const adjacentTiles = [
                emptyTileIndex - 1, // Left
                emptyTileIndex + 1, // Right
                emptyTileIndex - 4, // Up
                emptyTileIndex + 4, // Down
            ];

            if (adjacentTiles.includes(clickedTileIndex)) {
                const newTiles = [...tiles];
                [newTiles[emptyTileIndex], newTiles[clickedTileIndex]] = [newTiles[clickedTileIndex], newTiles[emptyTileIndex]];
                setTiles(newTiles);

                // Check if solved
                const isSolved = newTiles.every((tile, i) => tile.part === i);
                if (isSolved) {
                    const newScore = score + 25;
                    setScore(newScore);
                    setIsGameOver(true);
                    saveScore('picturePuzzle', Math.max(scores.picturePuzzle, newScore));
                }
            }
        };

        const handleInstructions = () => {
            speakInstructions(
                'Welcome to Picture Puzzle! You have 90 seconds to complete the picture. The image is split into 16 tiles, and one tile is missing. Tap a tile next to the empty space to swap it. Keep swapping tiles until the picture is complete. Good luck!'
            );
        };

        return (
            <div className="p-4">
                <h3 className="text-xl font-medium text-[#5D4037] mb-2 font-comic-neue">Picture Puzzle 🖼️</h3>
                <p className="text-lg text-[#5D4037] mb-2 font-comic-neue">Score: {score} 🎯 | Time: {timer}s ⏳</p>
                <button
                    onClick={handleInstructions}
                    className="bg-[#FFCCBC] text-[#5D4037] p-2 rounded-lg mb-2 flex items-center gap-1 mx-auto shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                    <FaVolumeUp /> Play Instructions
                </button>
                {isGameOver ? (
                    <div className="text-center">
                        <p className="text-lg text-[#388E3C] font-comic-neue mb-2">
                            {tiles.every((tile, i) => tile.part === i) ? 'You Win! 🎉' : 'Time’s Up! Try Again! 😊'}
                        </p>
                        <button
                            onClick={initializeGame}
                            className="bg-gradient-to-r from-[#B2DFDB] to-[#80CBC4] text-[#00695C] p-3 rounded-xl text-lg font-medium flex items-center gap-1 mx-auto shadow-md hover:shadow-lg transition-shadow duration-300"
                        >
                            <FaRedo /> Play Again
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-1 w-64 h-64 mx-auto">
                        {tiles.map((tile, index) => (
                            <div
                                key={tile.id}
                                onClick={() => handleTileClick(index)}
                                className={`w-16 h-16 ${tile.part === 15 ? 'bg-[#E6E2D3]' : ''} cursor-pointer touch-action-none`}
                                style={
                                    tile.part !== 15
                                        ? {
                                            backgroundImage: `url(${tile.image})`,
                                            backgroundSize: '256px 256px',
                                            backgroundPosition: `${-(tile.part % 4) * 64}px ${-Math.floor(tile.part / 4) * 64}px`,
                                        }
                                        : {}
                                }
                            ></div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Game 4: Tic-Tac-Toe Battle (Simulated opponent with random moves)
    const TicTacToeBattle = () => {
        const [board, setBoard] = useState(Array(9).fill(null));
        const [isPlayerTurn, setIsPlayerTurn] = useState(true);
        const [score, setScore] = useState(0);
        const [message, setMessage] = useState('');
        const [gameOver, setGameOver] = useState(false);

        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6], // Diagonals
        ];

        const initializeGame = () => {
            setBoard(Array(9).fill(null));
            setIsPlayerTurn(true);
            setMessage('');
            setGameOver(false);
        };

        useEffect(() => {
            initializeGame();
        }, []);

        useEffect(() => {
            if (!isPlayerTurn && !gameOver) {
                const timer = setTimeout(() => {
                    const availableSpots = board
                        .map((spot, index) => (spot === null ? index : null))
                        .filter((spot) => spot !== null);
                    if (availableSpots.length > 0) {
                        const randomSpot = availableSpots[Math.floor(Math.random() * availableSpots.length)];
                        const newBoard = [...board];
                        newBoard[randomSpot] = 'O';
                        setBoard(newBoard);
                        setIsPlayerTurn(true);
                        checkGameStatus(newBoard);
                    }
                }, 1000);
                return () => clearTimeout(timer);
            }
        }, [isPlayerTurn, gameOver]);

        const checkGameStatus = (currentBoard) => {
            for (const combination of winningCombinations) {
                const [a, b, c] = combination;
                if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                    setGameOver(true);
                    if (currentBoard[a] === 'X') {
                        const newScore = score + 15;
                        setScore(newScore);
                        setMessage('You Win! 🎉');
                        saveScore('ticTacToe', Math.max(scores.ticTacToe, newScore));
                    } else {
                        setMessage('Opponent Wins! 😢');
                        saveScore('ticTacToe', Math.max(scores.ticTacToe, score));
                    }
                    return;
                }
            }
            if (!currentBoard.includes(null)) {
                setGameOver(true);
                const newScore = score + 5;
                setScore(newScore);
                setMessage('It’s a Draw! 🤝');
                saveScore('ticTacToe', Math.max(scores.ticTacToe, newScore));
            }
        };

        const handleCellClick = (index) => {
            if (board[index] || !isPlayerTurn || gameOver) return;

            const newBoard = [...board];
            newBoard[index] = 'X';
            setBoard(newBoard);
            setIsPlayerTurn(false);
            checkGameStatus(newBoard);
        };

        const handleInstructions = () => {
            speakInstructions(
                'Welcome to Tic-Tac-Toe Battle! You are X, and your opponent is O. Tap on an empty cell to place your X. The opponent will place an O after a short delay. Try to get three X’s in a row, column, or diagonal to win. If neither wins, it’s a draw. Have fun!'
            );
        };

        return (
            <div className="p-4">
                <h3 className="text-xl font-medium text-[#5D4037] mb-2 font-comic-neue">Tic-Tac-Toe Battle ❌⭕</h3>
                <p className="text-lg text-[#5D4037] mb-2 font-comic-neue">Score: {score} 🎯</p>
                <button
                    onClick={handleInstructions}
                    className="bg-[#FFCCBC] text-[#5D4037] p-2 rounded-lg mb-2 flex items-center gap-1 mx-auto shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                    <FaVolumeUp /> Play Instructions
                </button>
                <div className="grid grid-cols-3 gap-2 w-48 h-48 mx-auto">
                    {board.map((cell, index) => (
                        <div
                            key={index}
                            onClick={() => handleCellClick(index)}
                            className="bg-[#FFF5F5] p-4 rounded-lg shadow-md text-3xl text-center cursor-pointer touch-action-none"
                        >
                            {cell === 'X' ? '❌' : cell === 'O' ? '⭕' : ''}
                        </div>
                    ))}
                </div>
                {message && (
                    <p className="text-lg text-[#388E3C] mt-2 font-comic-neue text-center">{message}</p>
                )}
                {gameOver && (
                    <button
                        onClick={initializeGame}
                        className="mt-4 bg-gradient-to-r from-[#B2DFDB] to-[#80CBC4] text-[#00695C] p-3 rounded-xl text-lg font-medium flex items-center gap-1 mx-auto shadow-md hover:shadow-lg transition-shadow duration-300"
                    >
                        <FaRedo /> Play Again
                    </button>
                )}
            </div>
        );
    };

    // Game cards
    const games = [
        { name: 'Memory Match', component: <MemoryMatch />, emoji: '🧠', description: 'Match the emoji pairs!' },
        { name: 'Word Scramble', component: <WordScramble />, emoji: '📝', description: 'Unscramble the word!' },
        { name: 'Picture Puzzle', component: <PicturePuzzle />, emoji: '🖼️', description: 'Complete the picture!' },
        { name: 'Tic-Tac-Toe Battle', component: <TicTacToeBattle />, emoji: '❌⭕', description: 'Beat the opponent!' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#E0F7FA] to-[#F5F5F5]">
            {googleFontsLink}

            {/* Header */}
            <header className="bg-[#B2DFDB] p-4 shadow-md">
                <h1 className="text-3xl font-bold text-[#00695C] text-center font-comic-neue">Entertainment for Elders 🎉</h1>
                <div className="flex justify-center items-center gap-2 mt-2">
                    <FaTrophy className="text-[#00695C] text-xl" />
                    <p className="text-lg font-semibold text-[#00695C] font-comic-neue">
                        High Scores: Memory: {scores.memoryMatch} | Words: {scores.wordScramble} | Puzzle: {scores.picturePuzzle} | Tic-Tac-Toe: {scores.ticTacToe}
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    <h2 className="text-2xl font-semibold text-[#5D4037] mb-2 font-comic-neue">Choose a Game to Play</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {games.map((game) => (
                            <button
                                key={game.name}
                                onClick={() => openModal(game.component)}
                                className="bg-[#FFF5F5] p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-[#5D4037] text-lg font-medium flex flex-col items-center gap-2 border-2 border-[#FFCCBC] animate-fade-in touch-action-none"
                            >
                                <span className="text-3xl">{game.emoji}</span>
                                <span className="font-comic-neue">{game.name}</span>
                                <p className="text-sm text-[#5D4037] font-comic-neue">{game.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#FFF5F5] p-4 rounded-xl shadow-lg max-w-md w-full relative border-2 border-[#FFCCBC]">
                        <button
                            onClick={closeModal}
                            className="absolute top-2 right-2 text-[#5D4037] text-2xl"
                        >
                            <FaTimes />
                        </button>
                        {selectedGame}
                    </div>
                </div>
            )}

            {/* Desktop and Mobile View Adjustments */}
            <style jsx>{`
        .min-h-screen {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(to bottom right, #E0F7FA, #F5F5F5);
        }
        .flex-1 {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .font-comic-neue {
          font-family: 'Comic Neue', cursive;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        .touch-action-none {
          touch-action: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (min-width: 1024px) {
          .max-w-4xl {
            max-width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .space-y-4 > * + * {
            margin-top: 1rem;
          }
          .text-3xl {
            font-size: 2rem;
          }
          .text-2xl {
            font-size: 1.5rem;
          }
          .text-xl {
            font-size: 1.25rem;
          }
          .text-lg {
            font-size: 1rem;
          }
          .text-sm {
            font-size: 0.875rem;
          }
          .p-4 {
            padding: 1rem;
          }
          .p-3 {
            padding: 0.75rem;
          }
          .p-2 {
            padding: 0.5rem;
          }
          .w-16 {
            width: 4rem;
          }
          .h-16 {
            height: 4rem;
          }
          .w-48 {
            width: 12rem;
          }
          .h-48 {
            height: 12rem;
          }
          .w-64 {
            width: 16rem;
          }
          .h-64 {
            height: 16rem;
          }
          .grid-cols-5 {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
          .grid-cols-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          .grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .gap-4 {
            gap: 1rem;
          }
          .gap-2 {
            gap: 0.5rem;
          }
          .gap-1 {
            gap: 0.25rem;
          }
          .rounded-xl {
            border-radius: 0.75rem;
          }
          .rounded-lg {
            border-radius: 0.5rem;
          }
        }
        @media (max-width: 640px) {
          .max-w-4xl {
            max-width: 100%;
          }
          .text-3xl {
            font-size: 1.75rem;
          }
          .text-2xl {
            font-size: 1.25rem;
          }
          .text-xl {
            font-size: 1.1rem;
          }
          .text-lg {
            font-size: 0.9rem;
          }
          .text-sm {
            font-size: 0.75rem;
          }
          .p-4 {
            padding: 0.75rem;
          }
          .p-3 {
            padding: 0.5rem;
          }
          .p-2 {
            padding: 0.25rem;
          }
          .w-16 {
            width: 3rem;
          }
          .h-16 {
            height: 3rem;
          }
          .w-48 {
            width: 9rem;
          }
          .h-48 {
            height: 9rem;
          }
          .w-64 {
            width: 12rem;
          }
          .h-64 {
            height: 12rem;
          }
          .space-y-4 > * + * {
            margin-top: 0.75rem;
          }
          .grid-cols-1 {
            grid-template-columns: 1fr;
          }
          .grid-cols-5 {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
          .grid-cols-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          .grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .gap-4 {
            gap: 0.75rem;
          }
          .gap-2 {
            gap: 0.5rem;
          }
          .gap-1 {
            gap: 0.25rem;
          }
          .rounded-xl {
            border-radius: 0.5rem;
          }
          .rounded-lg {
            border-radius: 0.375rem;
          }
        }
      `}</style>
        </div>
    );
};

export default Entertainment;