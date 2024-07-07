import React, { useState, useEffect, useRef, useCallback } from 'react';

const Whisper = ({ onTranscript, language = 'en-US', onStatusChange, onMicLevelChange }) => {
  const [isListening, setIsListening] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const minLevelRef = useRef(Infinity);
  const maxLevelRef = useRef(-Infinity);

  const startListening = useCallback(() => {
    console.log('Starting listening...');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        onStatusChange('listening');
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  }, [onStatusChange]);

  const stopListening = useCallback(() => {
    console.log('Stopping listening...');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        onStatusChange('idle');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }, [onStatusChange]);

  const startMicrophoneCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMicLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;

          minLevelRef.current = Math.min(minLevelRef.current, average);
          maxLevelRef.current = Math.max(maxLevelRef.current, average);

          const range = maxLevelRef.current - minLevelRef.current;
          const normalizedLevel = range > 0 ? (average - minLevelRef.current) / range : 0;

          setMicLevel(prevLevel => {
            const newLevel = prevLevel * 0.8 + normalizedLevel * 0.2;
            onMicLevelChange(newLevel);
            return newLevel;
          });
        }
        requestAnimationFrame(updateMicLevel);
      };

      updateMicLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, [onMicLevelChange]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language;

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        onStatusChange('listening');
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        onStatusChange('idle');
      };

      recognitionRef.current.onresult = (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        console.log('Transcript:', transcript);
        onTranscript(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        onStatusChange('error');
      };

      startMicrophoneCapture();
    } else {
      console.error('Speech recognition not supported in this browser');
      onStatusChange('unsupported');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [language, onTranscript, onStatusChange, startMicrophoneCapture]);

  return { isListening, startListening, stopListening, micLevel };
};

export default Whisper;