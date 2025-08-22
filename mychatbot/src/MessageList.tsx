import React from 'react';
import { Message } from './types';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, messagesEndRef, suggestions, onSuggestionClick }) => (
  <div className="messages-area">
    {messages.length === 0 ? (
      <div className="empty-state">
        <h3>👋 Welcome to My Chatbot!</h3>
        <p>
          I'm here to chat with you! Ask me anything or try one of these suggestions:
        </p>
        {suggestions && suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                className="suggestion-chip"
                onClick={() => onSuggestionClick && onSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    ) : (
      <>
        {messages.map((message: Message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-avatar">
              {message.sender === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <div>{message.text}</div>
              <div className="message-time">
                {(() => {
                  const d = new Date(message.timestamp);
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  return `${day}/${month}/${year} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                })()}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="loading-indicator">
                <span>Thinking</span>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )}
    <div ref={messagesEndRef} />
  </div>
);

export default MessageList;
