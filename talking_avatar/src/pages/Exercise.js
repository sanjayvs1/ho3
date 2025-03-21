import React, { useState, useEffect, useRef } from 'react';
import { db } from '../utils/firebaseConfig'; // Adjust path to your firebase config file
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FaUserCircle, FaPlay, FaPause, FaArrowLeft, FaRunning, FaPills, FaHeartbeat, FaBalanceScale, FaHandHolding, FaDumbbell } from 'react-icons/fa';
import { GiKneeCap } from 'react-icons/gi';

// Import Google Fonts for a playful look
const googleFontsLink = (
    <link
        href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap"
        rel="stylesheet"
    />
);

const Exercise = () => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [timer, setTimer] = useState(30); // 30 seconds per exercise
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [rewardPoints, setRewardPoints] = useState(0);
    const [userId, setUserId] = useState(null);
    const timerRef = useRef(null);

    // Exercise categories with icons, emojis, and static images
    const exerciseCategories = {
        'Knee Pain': {
            icon: <GiKneeCap className="text-[#5D4037] text-3xl" />,
            emoji: '🦵',
            exercises: [
                { name: 'Leg Lifts', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTILt4xm3grAig4kUYXSpMfoLcjdIRTVzgtdA&s', duration: 30 },
                { name: 'Knee Flexion', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSM81Rb7kN5ip3eub9FUbVFv4qF1UvpgeRfg&s', duration: 30 },
                { name: 'Hamstring Stretch', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-OsUJVFEWLM54EYKr9cxgxs6OCk5cEuuyDA&s', duration: 30 },
                { name: 'Quad Stretch', image: 'https://static.vecteezy.com/system/resources/thumbnails/018/746/793/small_2x/man-doing-standing-quad-stretch-yoga-workout-on-the-wall-flat-illustration-isolated-on-white-background-vector.jpg', duration: 30 },
                { name: 'Step-Ups', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmSw7Whgpt5tFuYcGqtTGD7qalAXrylQgcrQ&s', duration: 30 },
            ],
        },
        'Stretching': {
            icon: <FaRunning className="text-[#5D4037] text-3xl" />,
            emoji: '🤸‍♀️',
            exercises: [
                { name: 'Neck Stretch', image: 'https://images.pexels.com/photos/6456146/pexels-photo-6456146.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Shoulder Roll', image: 'https://images.pexels.com/photos/6456147/pexels-photo-6456147.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Side Stretch', image: 'https://images.pexels.com/photos/6456148/pexels-photo-6456148.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Calf Stretch', image: 'https://images.pexels.com/photos/6456149/pexels-photo-6456149.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Back Stretch', image: 'https://images.pexels.com/photos/6456150/pexels-photo-6456150.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
            ],
        },
        'Medication Reminder': {
            icon: <FaPills className="text-[#5D4037] text-3xl" />,
            emoji: '💊',
            exercises: [
                { name: 'Gentle Arm Swing', image: 'https://images.pexels.com/photos/6456151/pexels-photo-6456151.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Wrist Rotation', image: 'https://images.pexels.com/photos/6456152/pexels-photo-6456152.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Ankle Circles', image: 'https://images.pexels.com/photos/6456153/pexels-photo-6456153.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Seated March', image: 'https://images.pexels.com/photos/6456154/pexels-photo-6456154.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Finger Stretch', image: 'https://images.pexels.com/photos/6456155/pexels-photo-6456155.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
            ],
        },
        'Back Pain': {
            icon: <FaHeartbeat className="text-[#5D4037] text-3xl" />,
            emoji: '🧘‍♀️',
            exercises: [
                { name: 'Cat-Cow Stretch', image: 'https://images.pexels.com/photos/6456156/pexels-photo-6456156.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Child’s Pose', image: 'https://images.pexels.com/photos/6456157/pexels-photo-6456157.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Spinal Twist', image: 'https://images.pexels.com/photos/6456158/pexels-photo-6456158.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Pelvic Tilt', image: 'https://images.pexels.com/photos/6456159/pexels-photo-6456159.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Bridge Exercise', image: 'https://images.pexels.com/photos/6456160/pexels-photo-6456160.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
            ],
        },
        'Balance Improvement': {
            icon: <FaBalanceScale className="text-[#5D4037] text-3xl" />,
            emoji: '⚖️',
            exercises: [
                { name: 'Heel-to-Toe Walk', image: 'https://images.pexels.com/photos/6456161/pexels-photo-6456161.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Single Leg Stand', image: 'https://images.pexels.com/photos/6456162/pexels-photo-6456162.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Side Leg Raise', image: 'https://images.pexels.com/photos/6456163/pexels-photo-6456163.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Tandem Stance', image: 'https://images.pexels.com/photos/6456164/pexels-photo-6456164.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Weight Shift', image: 'https://images.pexels.com/photos/6456165/pexels-photo-6456165.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
            ],
        },
        'Joint Mobility': {
            icon: <FaHandHolding className="text-[#5D4037] text-3xl" />,
            emoji: '🤝',
            exercises: [
                { name: 'Shoulder Circles', image: 'https://images.pexels.com/photos/6456166/pexels-photo-6456166.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Hip Rotation', image: 'https://images.pexels.com/photos/6456167/pexels-photo-6456167.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Knee Circles', image: 'https://images.pexels.com/photos/6456168/pexels-photo-6456168.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Elbow Flexion', image: 'https://images.pexels.com/photos/6456169/pexels-photo-6456169.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Wrist Flex', image: 'https://images.pexels.com/photos/6456170/pexels-photo-6456170.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
            ],
        },
        'General Fitness': {
            icon: <FaDumbbell className="text-[#5D4037] text-3xl" />,
            emoji: '💪',
            exercises: [
                { name: 'Seated Leg Raise', image: 'https://images.pexels.com/photos/6456171/pexels-photo-6456171.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Arm Raise', image: 'https://images.pexels.com/photos/6456172/pexels-photo-6456172.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Torso Twist', image: 'https://images.pexels.com/photos/6456173/pexels-photo-6456173.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'March in Place', image: 'https://images.pexels.com/photos/6456174/pexels-photo-6456174.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
                { name: 'Toe Taps', image: 'https://images.pexels.com/photos/6456175/pexels-photo-6456175.jpeg?auto=compress&cs=tinysrgb&w=300', duration: 30 },
            ],
        },
    };

    // Fetch user data and reward points from Firestore
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
                    const points = userDoc.data().rewardPoints || 0;
                    setRewardPoints(points);
                } else {
                    await setDoc(userDocRef, { rewardPoints: 0 });
                    setRewardPoints(0);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };
        fetchUserData();
    }, []);

    // Text-to-Speech function
    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            window.speechSynthesis.speak(utterance);
        } else {
            console.log('Text-to-speech not supported in this browser');
        }
    };

    // Announce category selection
    useEffect(() => {
        if (selectedCategory) {
            speak(`You have selected ${selectedCategory} exercises. Let's get started!`);
        }
    }, [selectedCategory]);

    // Timer logic with speech announcements
    useEffect(() => {
        if (isTimerRunning && timer > 0) {
            timerRef.current = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            clearInterval(timerRef.current);
            const currentExercises = exerciseCategories[selectedCategory].exercises;
            if (currentExerciseIndex < currentExercises.length - 1) {
                speak('Great job! Let’s move to the next exercise.');
                setCurrentExerciseIndex(prev => prev + 1);
                setTimer(currentExercises[currentExerciseIndex + 1].duration);
                setIsTimerRunning(true);
                setTimeout(() => {
                    speak(`Starting ${currentExercises[currentExerciseIndex + 1].name}. Let's do this for ${currentExercises[currentExerciseIndex + 1].duration} seconds.`);
                }, 1000);
            } else {
                setIsTimerRunning(false);
                const newPoints = rewardPoints + 10;
                setRewardPoints(newPoints);

                if (userId) {
                    const userDocRef = doc(db, 'users', userId);
                    setDoc(userDocRef, { rewardPoints: newPoints }, { merge: true })
                        .then(() => {
                            console.log('Reward points updated successfully:', newPoints);
                        })
                        .catch(error => {
                            console.error('Error updating reward points:', error);
                        });
                }

                speak(`Congratulations! You've completed the ${selectedCategory} exercises and earned 10 points!`);
            }
        }

        return () => clearInterval(timerRef.current);
    }, [timer, isTimerRunning, currentExerciseIndex, selectedCategory, rewardPoints, userId]);

    // Announce the first exercise when starting
    const startExercise = () => {
        setIsTimerRunning(true);
        speak(`Starting ${exerciseCategories[selectedCategory].exercises[currentExerciseIndex].name}. Let's do this for ${exerciseCategories[selectedCategory].exercises[currentExerciseIndex].duration} seconds.`);
    };

    // Pause/Resume the timer
    const togglePause = () => {
        setIsTimerRunning(prev => !prev);
        if (isTimerRunning) {
            speak('Exercise paused.');
        } else {
            speak('Resuming exercise.');
        }
    };

    // Reset the exercise session
    const resetExercise = () => {
        setSelectedCategory(null);
        setCurrentExerciseIndex(0);
        setTimer(30);
        setIsTimerRunning(false);
        window.speechSynthesis.cancel();
    };

    // Calculate progress percentage
    const progressPercentage = selectedCategory
        ? ((currentExerciseIndex + 1) / exerciseCategories[selectedCategory].exercises.length) * 100
        : 0;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#E0F7FA] to-[#F5F5F5]">
            {googleFontsLink}

            {/* Header */}
            <header className="bg-[#B2DFDB] p-4 shadow-md">
                <h1 className="text-3xl font-bold text-[#00695C] text-center font-comic-neue">Exercise for Elders 🌟</h1>
                <div className="flex justify-center items-center gap-2 mt-2">
                    <FaUserCircle className="text-[#00695C] text-xl" />
                    <p className="text-lg font-semibold text-[#00695C] font-comic-neue">
                        Reward Points: {rewardPoints} 🏆
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    {!selectedCategory ? (
                        <>
                            <h2 className="text-2xl font-semibold text-[#5D4037] mb-2 font-comic-neue">Choose an Exercise Category</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.keys(exerciseCategories).map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className="bg-[#FFF5F5] p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-[#5D4037] text-lg font-medium flex items-center gap-2 border-2 border-[#FFCCBC] animate-fade-in"
                                    >
                                        {exerciseCategories[category].icon}
                                        <span className="font-comic-neue">{category} {exerciseCategories[category].emoji}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-semibold text-[#5D4037] font-comic-neue">
                                    {selectedCategory} - Exercise {currentExerciseIndex + 1}/5
                                </h2>
                                <button
                                    onClick={resetExercise}
                                    className="bg-gradient-to-r m-3 from-[#B2DFDB] to-[#80CBC4] text-[#00695C] p-3 rounded-xl text-lg font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow duration-300"
                                >
                                    <FaArrowLeft className="text-xl " /> 
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-[#E6E2D3] rounded-full h-3">
                                <div
                                    className="bg-[#C8E6C9] h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>

                            {/* Current Exercise */}
                            <div className="bg-[#FFF5F5] p-4 rounded-xl shadow-lg flex flex-col items-center border-2 border-[#FFCCBC] animate-fade-in">
                                <h3 className="text-xl font-medium text-[#5D4037] mb-2 flex items-center gap-2 font-comic-neue">
                                    {exerciseCategories[selectedCategory].exercises[currentExerciseIndex].name} {exerciseCategories[selectedCategory].emoji}
                                </h3>
                                <img
                                    src={exerciseCategories[selectedCategory].exercises[currentExerciseIndex].image}
                                    alt={exerciseCategories[selectedCategory].exercises[currentExerciseIndex].name}
                                    className="w-full max-w-xs h-40 object-cover rounded-lg mb-2"
                                />
                                <p className="text-lg text-[#5D4037] mb-2 font-comic-neue">Time Remaining: {timer} seconds ⏳</p>
                                <div className="flex gap-2">
                                    {!isTimerRunning ? (
                                        <button
                                            onClick={startExercise}
                                            className="bg-gradient-to-r from-[#C8E6C9] to-[#A5D6A7] text-[#388E3C] p-3 rounded-xl text-lg font-medium flex items-center gap-1 shadow-md hover:shadow-lg transition-shadow duration-300"
                                        >
                                            <FaPlay /> Start
                                        </button>
                                    ) : (
                                        <button
                                            onClick={togglePause}
                                            className="bg-gradient-to-r from-[#E6E2D3] to-[#D4CBB3] text-[#5D4037] p-3 rounded-xl text-lg font-medium flex items-center gap-1 shadow-md hover:shadow-lg transition-shadow duration-300"
                                        >
                                            {isTimerRunning ? <FaPause /> : <FaPlay />}
                                            {isTimerRunning ? 'Pause' : 'Resume'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Motivational Message */}
                            {timer === 0 && currentExerciseIndex < exerciseCategories[selectedCategory].exercises.length - 1 && (
                                <div className="bg-[#C8E6C9] p-3 rounded-xl shadow-lg text-center animate-fade-in">
                                    <p className="text-lg text-[#388E3C] font-comic-neue">Great job! Moving to the next exercise... 🌟</p>
                                </div>
                            )}

                            {/* Completion Message */}
                            {currentExerciseIndex === exerciseCategories[selectedCategory].exercises.length - 1 && timer === 0 && (
                                <div className="bg-[#C8E6C9] p-4 rounded-xl shadow-lg text-center animate-fade-in">
                                    <h3 className="text-xl font-medium text-[#388E3C] mb-2 font-comic-neue">
                                        Congratulations! You've completed the {selectedCategory} exercises! 🎉
                                    </h3>
                                    <p className="text-lg text-[#388E3C] font-comic-neue">You've earned 10 reward points! 🏆</p>
                                    <button
                                        onClick={resetExercise}
                                        className="mt-2 bg-gradient-to-r from-[#B2DFDB] to-[#80CBC4] text-[#00695C] p-3 rounded-xl text-lg font-medium flex items-center gap-1 mx-auto shadow-md hover:shadow-lg transition-shadow duration-300"
                                    >
                                        <FaArrowLeft /> Choose Another Category
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

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
          .p-4 {
            padding: 1rem;
          }
          .h-3 {
            height: 0.5rem;
          }
          .max-w-xs {
            max-width: 16rem;
          }
          .h-40 {
            height: 10rem;
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
          .rounded-xl {
            border-radius: 0.75rem;
          }
          img {
            max-width: 100%;
            height: auto;
          }
        }
        @media (max-width: 640px) {
          .max-w-4xl {
            max-width: 100%;
          }
          .max-w-xs {
            max-width: 80%;
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
          .p-4 {
            padding: 0.75rem;
          }
          .h-3 {
            height: 0.5rem;
          }
          .h-40 {
            height: 8rem;
          }
          .space-y-4 > * + * {
            margin-top: 0.75rem;
          }
          .grid-cols-1 {
            grid-template-columns: 1fr;
          }
          .gap-4 {
            gap: 0.75rem;
          }
          .gap-2 {
            gap: 0.5rem;
          }
          .rounded-xl {
            border-radius: 0.5rem;
          }
          img {
            max-width: 100%;
            height: auto;
          }
        }
      `}</style>
        </div>
    );
};

export default Exercise;