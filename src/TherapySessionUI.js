// TherapySessionUI.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import WelcomeScreen from './WelcomeScreen';
import ChatOverlay from './ChatOverlay';
import ControlBar from './ControlBar';
import Apps from './Apps';
import { extractKeywords, extractTimerDuration } from './utils';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

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
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userMicLevel, setUserMicLevel] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [language, setLanguage] = useState('english');
  const [isGPT4, setIsGPT4] = useState(false);
  const [initialInstructions, setInitialInstructions] = useState('');
  const [isLoudspeakerOn, setIsLoudspeakerOn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userVideoStream, setUserVideoStream] = useState(null);
  const [activeKeywords, setActiveKeywords] = useState([]);
  const [timerDuration, setTimerDuration] = useState(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);
  const ttsAudioRef = useRef(null);
  const videoRef = useRef(null);


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

    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    ttsAudioRef.current = new Audio();
    const source = audioContextRef.current.createMediaElementSource(ttsAudioRef.current);
    source.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (isSessionStarted) {
      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          micStreamRef.current = stream;
          setUserVideoStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          initSpeechRecognition();
        } catch (error) {
          console.error("Error accessing microphone or camera:", error);
        }
      };

      initAudio();
      const timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);

      return () => {
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach(track => track.stop());
        }
        clearInterval(timer);
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    }
  }, [isSessionStarted]);

  useEffect(() => {
    let animationFrameId;

    const checkAudioOutput = () => {
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        if (sum > 0) {
          setVoiceStatus('speaking');
        } else if (voiceStatus === 'speaking') {
          setVoiceStatus('listening');
          if (recognitionRef.current) startRecognition();
        }
      }
      animationFrameId = requestAnimationFrame(checkAudioOutput);
    };

    checkAudioOutput();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [voiceStatus]);

  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'greek' ? 'el-GR' : 'en-US';
      recognitionRef.current.onstart = () => {
        setVoiceStatus('listening');
        setIsMicOn(true);
      };
      recognitionRef.current.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript;
          setMessages(prev => [...prev, { type: 'user', text: transcript }]);
          sendToGPTAPI(transcript);
        }
      };
      recognitionRef.current.onend = () => {
        if (voiceStatus === 'listening') {
          startRecognition();
        } else {
          setIsMicOn(false);
        }
      };
      startRecognition();
    }
  };

  const startRecognition = () => {
    if (recognitionRef.current && !recognitionRef.current.active) {
      recognitionRef.current.start();
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const sendToGPTAPI = async (text) => {
    setVoiceStatus('processing');
    try {
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not set');
      }

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: isGPT4 ? "gpt-4" : "gpt-3.5-turbo",
          messages: [
            { role: "system", content: initialInstructions },
            { role: "user", content: `My name is ${userName} and I'm ${userAge} years old. Please respond in ${language}.` },
            { role: "user", content: text }
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      setMessages(prev => [...prev, { type: 'ai', text: aiResponse }]);

      // Extract keywords and timer duration
      const keywords = extractKeywords(aiResponse);
      setActiveKeywords(keywords);
      
      const duration = extractTimerDuration(aiResponse);
      if (duration) setTimerDuration(duration);
      
      speakAiResponse(aiResponse);
    } catch (error) {
      console.error("Error calling GPT API:", error);
      setVoiceStatus('listening');
      setMessages(prev => [...prev, { type: 'ai', text: "Sorry, I encountered an error. Please try again." }]);
    }
  };

  const speakAiResponse = (text) => {
    stopRecognition();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'greek' ? 'el-GR' : 'en-US';
    utterance.onend = () => {
      setVoiceStatus('listening');
      if (isMicOn) {
        startRecognition();
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  const startSession = () => {
    if (userName && userAge) {
      setIsSessionStarted(true);
      localStorage.setItem('userName', userName);
      localStorage.setItem('userAge', userAge.toString());
      localStorage.setItem('language', language);
      sendToGPTAPI("Hello, I'd like to start a therapy session.");
    }
  };

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    if (recognitionRef.current) {
      stopRecognition();
      recognitionRef.current.lang = newLanguage === 'greek' ? 'el-GR' : 'en-US';
      if (isMicOn) {
        startRecognition();
      }
    }
  };

  const toggleMic = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
      if (!isMicOn) {
        startRecognition();
      } else {
        stopRecognition();
      }
    }
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
      setMessages(prev => [...prev, { type: 'user', text: inputMessage.trim() }]);

      // Extract keywords and timer duration from user input
      const keywords = extractKeywords(inputMessage);
      setActiveKeywords(prev => [...prev, ...keywords]);
      
      const duration = extractTimerDuration(inputMessage);
      if (duration) setTimerDuration(duration);
      
      sendToGPTAPI(inputMessage.trim());
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
    setCallDuration(0);
    stopRecognition();
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (userVideoStream) {
      userVideoStream.getTracks().forEach(track => track.stop());
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeywordDismiss = (keyword) => {
    setActiveKeywords(prev => prev.filter(k => k !== keyword));
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
    <div className="relative h-screen bg-gray-100 overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center">
        <CoachNowLogo isSpeaking={voiceStatus === 'speaking' || voiceStatus === 'processing'} />
        <div className="text-xl mb-2">
          Status: {voiceStatus.charAt(0).toUpperCase() + voiceStatus.slice(1)}
        </div>
        <div className="text-lg">{formatTime(callDuration)}</div>
      </div>

      <div 
        className="absolute bottom-20 right-4 w-24 h-24 rounded-full overflow-hidden transition-all duration-100 ease-in-out"
        style={{
          boxShadow: `0 0 ${Math.floor(userMicLevel * 20)}px ${Math.floor(userMicLevel * 10)}px rgba(0, 0, 0, 0.3)`,
          transform: `scale(${1 + userMicLevel * 0.05})`
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
        messages={messages}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        chatContainerRef={chatContainerRef}
        isMobile={isMobile}
      />

      <Apps 
        activeKeywords={activeKeywords} 
        onKeywordDismiss={handleKeywordDismiss}
        timerDuration={timerDuration}
      />

      <ControlBar
        isMicOn={isMicOn}
        toggleMic={toggleMic}
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
      />
    </div>
  );
};

export default TherapySessionUI;