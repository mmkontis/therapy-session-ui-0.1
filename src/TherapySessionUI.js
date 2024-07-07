import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import WelcomeScreen from './WelcomeScreen';
import ChatOverlay from './ChatOverlay';
import ControlBar from './ControlBar';
import Whisper from './Whisper';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const DEEPGRAM_API_KEY = 'd3e02028bd2a659fb64e97b07733a1928df13bc0';

const CoachNowLogo = ({ isSpeaking }) => (
  <div className="flex items-center">
    <div 
      className="w-4 h-4 bg-black rounded-full mr-2 transition-transform duration-300"
      style={{ transform: isSpeaking ? 'scale(1.1)' : 'scale(0.65)' }}
    />
    <span>CoachNow</span>
  </div>
);

const TherapySessionUI = () => {
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState(25);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [messages, setMessages] = useState([]);
  const [apiMessages, setApiMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [language, setLanguage] = useState('english');
  const [isGPT4, setIsGPT4] = useState(false);
  const [initialInstructions, setInitialInstructions] = useState('');
  const [isLoudspeakerOn, setIsLoudspeakerOn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userVideoStream, setUserVideoStream] = useState(null);
  const [globalMicSensitivity, setGlobalMicSensitivity] = useState(0);
  const [isFirstMessageSent, setIsFirstMessageSent] = useState(false);
  const [sttApi, setSttApi] = useState('native');
  const [ttsApi, setTtsApi] = useState('native');

  const videoRef = useRef(null);

  const handleMessage = useCallback((text, isUser = false) => {
    console.log(`Handling ${isUser ? 'user' : 'AI'} message:`, text);
    const newMessage = { type: isUser ? 'user' : 'ai', text };
    const newApiMessage = { role: isUser ? 'user' : 'assistant', content: text };
    
    setMessages(prev => [...prev, newMessage]);
    setApiMessages(prev => [...prev, newApiMessage]);

    if (isUser) {
      sendToGPTAPI(text);
    }
  }, [apiMessages]);

  const handleTranscript = useCallback((transcript) => {
    console.log('Transcript received:', transcript);
    handleMessage(transcript, true);
  }, [handleMessage]);

  const handleStatusChange = useCallback((newStatus) => {
    console.log('Voice status changed:', newStatus);
    setVoiceStatus(newStatus);
  }, []);

  const handleMicLevelChange = useCallback((newLevel) => {
    setGlobalMicSensitivity(prevLevel => {
      const smoothingFactor = 0.1;
      return prevLevel * (1 - smoothingFactor) + newLevel * smoothingFactor;
    });
  }, []);

  const { isListening, startListening, stopListening, micLevel } = Whisper({
    onTranscript: handleTranscript,
    language: language === 'greek' ? 'el-GR' : 'en-US',
    onStatusChange: handleStatusChange,
    onMicLevelChange: handleMicLevelChange
  });

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedAge = localStorage.getItem('userAge');
    const storedLanguage = localStorage.getItem('language');
    if (storedName) setUserName(storedName);
    if (storedAge) setUserAge(parseInt(storedAge));
    if (storedLanguage) setLanguage(storedLanguage);

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    fetch('/initial-instructions.txt')
      .then(response => response.text())
      .then(text => setInitialInstructions(text))
      .catch(error => console.error('Error loading initial instructions:', error));

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (isSessionStarted) {
      const initVideo = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setUserVideoStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error("Error accessing camera:", error);
        }
      };

      initVideo();
      const timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
      startListening();

      return () => {
        if (userVideoStream) {
          userVideoStream.getTracks().forEach(track => track.stop());
        }
        clearInterval(timer);
        stopListening();
      };
    }
  }, [isSessionStarted, startListening, stopListening]);

  const sendToGPTAPI = async (text) => {
    setVoiceStatus('processing');
    try {
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not set');
      }

      const systemMessage = {
        role: 'system',
        content: `${initialInstructions}

User information:
- Name: ${userName}
- Age: ${userAge}
Please respond in ${language}.`
      };

      const fullApiMessages = [
        systemMessage,
        ...apiMessages,
        { role: 'user', content: text }
      ];

      console.log('Sending to GPT API:', fullApiMessages);

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: isGPT4 ? "gpt-4" : "gpt-3.5-turbo",
          messages: fullApiMessages,
          max_tokens: 60  // Add the max_tokens parameter here
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      handleMessage(aiResponse);
      speakAiResponse(aiResponse);
    } catch (error) {
      console.error("Error calling GPT API:", error);
      setVoiceStatus('listening');
      handleMessage("Sorry, I encountered an error. Please try again.");
    }
  };

  const speakAiResponse = (text) => {
    setVoiceStatus('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'greek' ? 'el-GR' : 'en-US';
    utterance.rate = 2.0; // Speed up the voice
    utterance.onend = () => {
      setVoiceStatus('listening');
    };
    window.speechSynthesis.speak(utterance);
  };

  const startSession = () => {
    if (userName && userAge) {
      setIsSessionStarted(true);
      localStorage.setItem('userName', userName);
      localStorage.setItem('userAge', userAge.toString());
      localStorage.setItem('language', language);
      handleMessage("Hello, I'd like to start a therapy session.", true);
      setIsFirstMessageSent(true);
    }
  };

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const toggleVideo = () => {
    if (userVideoStream) {
      userVideoStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      handleMessage(inputMessage.trim(), true);
      setInputMessage('');
    }
  };

  const toggleLoudspeaker = () => {
    setIsLoudspeakerOn(!isLoudspeakerOn);
    // Implement the actual audio routing logic here
  };

  const endSession = () => {
    setIsSessionStarted(false);
    setMessages([]);
    setApiMessages([]);
    setCallDuration(0);
    setIsFirstMessageSent(false);
    if (userVideoStream) {
      userVideoStream.getTracks().forEach(track => track.stop());
    }
    stopListening();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSTT = async () => {
    if (sttApi === 'native') {
      startListening();
    } else if (sttApi === 'deepgram') {
      // Implement Deepgram STT here
    }
  };

  const handleTTS = (text) => {
    if (ttsApi === 'native') {
      speakAiResponse(text);
    } else if (ttsApi === 'deepgram') {
      // Implement Deepgram TTS here
    }
  };

  if (!isSessionStarted) {
    return (
      <WelcomeScreen
        userName={userName}
        setUserName={setUserName}
        userAge={userAge}
        setUserAge={setUserAge}
        language={language}
        setLanguage={setLanguage}
        startSession={startSession}
      />
    );
  }

  return (
    <div className={`relative h-screen overflow-hidden flex flex-col ${isGPT4 ? 'bg-purple-500 text-white' : 'bg-gray-100'}`}>
      <div className="flex-1 flex flex-col items-center justify-center">
        <CoachNowLogo isSpeaking={voiceStatus === 'speaking' || voiceStatus === 'processing'} />
        <div className="text-xl mb-2">
          Status: {voiceStatus.charAt(0).toUpperCase() + voiceStatus.slice(1)}
        </div>
        <div className="text-lg">{formatTime(callDuration)}</div>
        {isGPT4 && <div className="text-lg mt-2">GPT-4 Enabled</div>}
      </div>

      <div 
        className="absolute bottom-20 left-4 w-24 h-24 rounded-full overflow-hidden transition-all duration-100 ease-in-out"
        style={{
          boxShadow: `0 0 ${Math.floor(globalMicSensitivity * 20)}px ${Math.floor(globalMicSensitivity * 10)}px rgba(0, 0, 0, 0.3)`,
          transform: `scale(${1 + globalMicSensitivity * 0.05})`
        }}
      >
        {isVideoOn ? (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        ) : (
          <img src="/path-to-default-avatar.png" alt="Your profile" className="w-full h-full object-cover" />
        )}
      </div>

      <ChatOverlay
        isChatOpen={isChatOpen}
        messages={messages.filter((msg, index) => !(msg.type === 'user' && index === 0))}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        isMobile={isMobile}
      />

      <ControlBar
        isListening={voiceStatus === 'listening'}
        isVideoOn={isVideoOn}
        toggleVideo={toggleVideo}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        language={language}
        changeLanguage={changeLanguage}
        isGPT4={isGPT4}
        setIsGPT4={setIsGPT4}
        endSession={endSession}
        isMobile={isMobile}
        isLoudspeakerOn={isLoudspeakerOn}
        toggleLoudspeaker={toggleLoudspeaker}
        globalMicSensitivity={globalMicSensitivity}
        voiceStatus={voiceStatus}
      />

     
    </div>
  );
};

export default TherapySessionUI;