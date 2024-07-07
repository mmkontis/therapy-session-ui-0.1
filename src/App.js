// App.js
import React, { useState } from 'react';
import Apps from './Apps';

function App() {
  const [activeKeywords, setActiveKeywords] = useState([]);
  const [timerDuration, setTimerDuration] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const handleKeywordDismiss = (keyword) => {
    setActiveKeywords(prev => prev.filter(k => k !== keyword));
  };

  return (
    <div className="App">
      <Apps 
        activeKeywords={activeKeywords}
        onKeywordDismiss={handleKeywordDismiss}
        timerDuration={timerDuration}
        isTimerActive={isTimerActive}
        setIsTimerActive={setIsTimerActive}
      />
    </div>
  );
}

export default App;