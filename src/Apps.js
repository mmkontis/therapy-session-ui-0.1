// Apps.js
import React, { useState, useEffect } from 'react';
import { formatTime } from './utils';

const CountdownTimer = ({ initialTime, isActive, setIsActive, onClose }) => {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    let timer;
    if (isActive && time > 0) {
      timer = setInterval(() => {
        setTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      setIsActive(false);
    }

    return () => clearInterval(timer);
  }, [isActive, time, setIsActive]);

  useEffect(() => {
    setTime(initialTime);
  }, [initialTime]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Countdown Timer</h2>
        <div className="text-5xl font-bold text-center text-blue-500 mb-4">
          {formatTime(time)}
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setIsActive(!isActive)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ... (other components remain the same)

const Apps = ({ activeKeywords, onKeywordDismiss, timerDuration, isTimerActive, setIsTimerActive }) => {
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
    if (timerDuration) {
      setShowTimer(true);
    }
  }, [timerDuration]);

  return (
    <div className="p-6 max-w-md mx-auto">
      {showTimer && (
        <CountdownTimer 
          initialTime={timerDuration || 300} 
          isActive={isTimerActive}
          setIsActive={setIsTimerActive}
          onClose={() => setShowTimer(false)}
        />
      )}
      <Milestones />
      <RelaxationTechniques />
      <MoodTracker />
      <ConversationRating />
      {activeKeywords.map((keyword, index) => (
        <KeywordPopup 
          key={index} 
          keyword={keyword} 
          onDismiss={() => onKeywordDismiss(keyword)} 
        />
      ))}
    </div>
  );
};

export default Apps;