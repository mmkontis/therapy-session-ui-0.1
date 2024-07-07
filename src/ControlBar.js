// ControlBar.js
import React, { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Globe, Sparkles, Volume2, VolumeX, Check } from 'lucide-react';

const ControlBar = ({ 
  isMicOn, 
  toggleMic, 
  isVideoOn, 
  toggleVideo, 
  isChatOpen, 
  setIsChatOpen, 
  language,
  changeLanguage, 
  isGPT4, 
  setIsGPT4, 
  endSession, 
  isMobile,
  isLoudspeakerOn, 
  toggleLoudspeaker
}) => {
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const toggleLanguageMenu = () => {
    setIsLanguageMenuOpen(!isLanguageMenuOpen);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-200 p-4 flex justify-center items-center space-x-2 md:space-x-4">
      <button
        onClick={toggleMic}
        className={`p-2 rounded-full ${isMicOn ? 'bg-gray-300' : 'bg-red-500 text-white'}`}
      >
        {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
      </button>
      <button
        onClick={toggleVideo}
        className={`p-2 rounded-full ${isVideoOn ? 'bg-gray-300' : 'bg-red-500 text-white'}`}
      >
        {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
      </button>
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`p-2 rounded-full ${isChatOpen ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
      >
        <MessageSquare size={24} />
      </button>
      <div className="relative">
        <button
          onClick={toggleLanguageMenu}
          className="p-2 rounded-full bg-gray-300"
        >
          <Globe size={24} />
        </button>
        {isLanguageMenuOpen && (
          <div className="absolute bottom-full right-0 mb-2 bg-white p-2 rounded-lg shadow-md">
            <button 
              onClick={() => {
                changeLanguage('english');
                setIsLanguageMenuOpen(false);
              }} 
              className={`block w-full text-left py-2 px-4 hover:bg-gray-100 ${language === 'english' ? 'bg-gray-200' : ''}`}
            >
              English {language === 'english' && <Check className="inline-block ml-2" size={16} />}
            </button>
            <button 
              onClick={() => {
                changeLanguage('greek');
                setIsLanguageMenuOpen(false);
              }} 
              className={`block w-full text-left py-2 px-4 hover:bg-gray-100 ${language === 'greek' ? 'bg-gray-200' : ''}`}
            >
              Greek {language === 'greek' && <Check className="inline-block ml-2" size={16} />}
            </button>
          </div>
        )}
      </div>
      <button
        onClick={() => setIsGPT4(!isGPT4)}
        className={`p-2 rounded-full ${isGPT4 ? 'bg-purple-500 text-white' : 'bg-gray-300'}`}
      >
        <Sparkles size={24} />
      </button>
      {isMobile && (
        <button
          onClick={toggleLoudspeaker}
          className={`p-2 rounded-full ${isLoudspeakerOn ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
        >
          {isLoudspeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      )}
      <button 
        onClick={endSession} 
        className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center"
      >
        <PhoneOff size={24} className="mr-2" /> 
        {!isMobile && "End Session"}
      </button>
    </div>
  );
};

export default ControlBar;