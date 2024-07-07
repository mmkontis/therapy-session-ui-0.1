// LanguageMenu.js
import React from 'react';
import { Check } from 'lucide-react';

const LanguageMenu = ({ isOpen, changeLanguage, currentLanguage }) => (
  isOpen && (
    <div className="absolute bottom-full right-0 mb-2 bg-white p-2 rounded-lg shadow-md">
      <button 
        onClick={() => changeLanguage('english')} 
        className={`block w-full text-left py-2 px-4 hover:bg-gray-100 ${currentLanguage === 'english' ? 'bg-gray-200' : ''}`}
      >
        English {currentLanguage === 'english' && <Check className="inline-block ml-2" size={16} />}
      </button>
      <button 
        onClick={() => changeLanguage('greek')} 
        className={`block w-full text-left py-2 px-4 hover:bg-gray-100 ${currentLanguage === 'greek' ? 'bg-gray-200' : ''}`}
      >
        Greek {currentLanguage === 'greek' && <Check className="inline-block ml-2" size={16} />}
      </button>
    </div>
  )
);

export default LanguageMenu;