// utils.js

export const extractTimerDuration = (text) => {
    const regex = /(\d+)\s*(min|minute|minutes|')/i;
    const match = text.match(regex);
    if (match) {
      return parseInt(match[1]) * 60; // Convert to seconds
    }
    return null;
  };
  
  export const extractKeywords = (text) => {
    const regex = /\*(.*?)\*/g;
    const matches = text.match(regex);
    if (matches) {
      return matches.map(match => match.replace(/\*/g, '').trim());
    }
    return [];
  };
  
  export const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  export const getLocalStorageItem = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  };
  
  export const setLocalStorageItem = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error);
    }
  };
  
  export const isMobileDevice = () => {
    return window.innerWidth <= 768;
  };
  
  export const handleError = (error, errorMessage = "An error occurred") => {
    console.error(errorMessage, error);
    // You could add more sophisticated error handling here, such as sending to a logging service
  };