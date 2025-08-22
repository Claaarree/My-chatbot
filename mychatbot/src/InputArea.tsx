import React, { useState } from 'react';

interface InputAreaProps {
  inputText: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

const InputArea: React.FC<InputAreaProps> = ({ inputText, onInputChange, onKeyPress, onSubmit, isLoading, inputRef }) => {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );

  const handleMicClick = () => {
    if (!speechSupported || isLoading) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);
    recognition.start();
    recognition.onresult = (event: any) => {
      let transcript = event.results[0][0].transcript;
      // Capitalize the first word
      transcript = transcript.replace(/^(\w)(\w*)/, (_: string, f: string, r: string) => f.toUpperCase() + r);
      onInputChange(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
  };

  return (
    <div className="input-area">
      <form onSubmit={onSubmit} className="input-form">        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={e => onInputChange(e)}
            onKeyPress={onKeyPress}
            placeholder="Type your message here... (Press Enter to send)"
            className="message-input"
            disabled={isLoading}
            rows={1}
          />
          {speechSupported && (
            <button
              type="button"
              className={`mic-button ${isListening ? 'listening' : ''}`}
              onClick={handleMicClick}
              disabled={isLoading || isListening}
              title={isListening ? 'Listening...' : 'Speak your message'}
            >
              <img src="/microphone-svgrepo-com.svg" alt="mic" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="send-button"
          disabled={!inputText.trim() || isLoading}
          title="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
};

export default InputArea;
