import React, { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Globe, Sparkles, Volume2, VolumeX } from 'lucide-react';

const ControlBar = ({ 
  isListening, 
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
  toggleLoudspeaker,
  globalMicSensitivity,
  voiceStatus
}) => {
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const toggleLanguageMenu = () => {
    setIsLanguageMenuOpen(!isLanguageMenuOpen);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-200 p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4" style={{width: '300px'}}>
        <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-100 ease-in-out"
            style={{ width: `${globalMicSensitivity * 100}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-600 whitespace-nowrap">Mic Level</span>
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2 md:space-x-4">
        <div
          className={`p-2 rounded-full ${
            isListening ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {isListening ? <Mic size={24} /> : <MicOff size={24} />}
        </div>

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
            className={`p-2 rounded-full ${isLanguageMenuOpen ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
          >
            <Globe size={24} />
          </button>
          {isLanguageMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 bg-white p-2 rounded-lg shadow-md">
              <button 
                onClick={() => {
                  changeLanguage('english');
                  setIsLanguageMenuOpen(false);
                }} 
                className={`block w-full text-left py-2 px-4 hover:bg-gray-100 ${language === 'english' ? 'bg-gray-200' : ''}`}
              >
                English
              </button>
              <button 
                onClick={() => {
                  changeLanguage('greek');
                  setIsLanguageMenuOpen(false);
                }} 
                className={`block w-full text-left py-2 px-4 hover:bg-gray-100 ${language === 'greek' ? 'bg-gray-200' : ''}`}
              >
                Greek
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
      </div>

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