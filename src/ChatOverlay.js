// ChatOverlay.js
import React from 'react';
import { Send } from 'lucide-react';

const ChatOverlay = ({ isChatOpen, messages, inputMessage, setInputMessage, handleSendMessage, chatContainerRef, isMobile }) => (
  <div 
    className={`fixed right-0 w-full md:w-[300px] transition-transform duration-300 ease-in-out ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}
    style={{
      top: 0,
      bottom: isMobile ? '72px' : '64px', // Adjust based on your control bar height
      background: 'linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.2))'
    }}
  >
    <div className="h-full bg-white bg-opacity-90 p-4 flex flex-col">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4">
        {messages.map((message, index) => (
          <div key={index} className={`mb-2 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded-lg ${message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>
              {message.text}
            </span>
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 px-4 py-2 rounded-l-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-r-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  </div>
);

export default ChatOverlay;