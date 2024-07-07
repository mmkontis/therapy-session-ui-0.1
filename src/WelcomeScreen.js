// WelcomeScreen.js
import React from 'react';

const WelcomeScreen = ({ userName, setUserName, userAge, setUserAge, language, setLanguage, startSession }) => {
  const welcomeMessage = language === 'greek' 
    ? `Καλώς ήρθατε${userName ? `, ${userName}` : ''}!`
    : `Welcome${userName ? `, ${userName}` : ''}!`;

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">AI Therapy Session</h1>
        <p className="mb-4">{welcomeMessage}</p>
        {!userName && (
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your first name"
            className="w-full px-3 py-2 mb-4 border rounded"
          />
        )}
        <div className="mb-4">
          <label className="block mb-2">Your age: {userAge}</label>
          <input
            type="range"
            min="18"
            max="100"
            value={userAge}
            onChange={(e) => setUserAge(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Select Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="english">English</option>
            <option value="greek">Greek</option>
          </select>
        </div>
        <button
          onClick={startSession}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {language === 'greek' ? 'Έναρξη Συνεδρίας' : 'Start Session'}
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;