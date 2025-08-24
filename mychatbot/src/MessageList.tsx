import React, { useState, useEffect } from 'react';
import { Message } from './types';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  searchTerm?: string;
  filteredMessages?: (Message & { sessionId?: string; sessionName?: string })[];
  onJumpToMessage?: (messageId: string, sessionId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onNewChat?: () => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading, 
  messagesEndRef, 
  suggestions, 
  onSuggestionClick,
  searchTerm,
  filteredMessages,
  onJumpToMessage,
  onDeleteMessage,
  onNewChat
}) => {
  
  const [showToast, setShowToast] = useState(false);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setShowToast(true);
      console.log('Message copied to clipboard');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowToast(true);
      console.log('Message copied to clipboard (fallback)');
    });
  };

  const speakMessage = (text: string) => {
    const utter = new window.SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  };

  const highlightSearchTerm = (text: string, term?: string): JSX.Element => {
    if (!term?.trim()) {
      return <span>{text}</span>;
    }
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <span key={index} className="search-highlight">{part}</span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="messages-area">
      {messages.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            // Show when search returns no results
            <>
              <h3>🔍 No results found</h3>
              <p>
                No messages found for "{searchTerm}". Try a different search term or start a new conversation.
              </p>
              {onNewChat && (
                <button
                  className="suggestion-chip start-new-chat-btn"
                  onClick={onNewChat}
                >
                  + Start New Chat
                </button>
              )}
            </>
          ) : (
            // Show when no messages at all (normal empty state)
            <>
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
            </>
          )}
        </div>
      ) : (
        <>
          {/* When searching, show only search results */}
          {searchTerm ? (
            filteredMessages && filteredMessages.length > 0 ? (              <div className="search-results-section">
                <h4>Search Results ({filteredMessages.length}) - All Sessions</h4><div className="search-results-list">
                  {filteredMessages.map((message) => (
                    <div 
                      key={`search-${message.id}`} 
                      className={`search-result-item ${message.sender}`}
                      onClick={() => onJumpToMessage && onJumpToMessage(message.id, message.sessionId)}
                    >
                      <div className="search-result-avatar">
                        {message.sender === 'user' ? '👤' : '🤖'}
                      </div>
                      <div className="search-result-content">
                        <div className="search-result-text">
                          {highlightSearchTerm(message.text, searchTerm)}
                        </div>
                        <div className="search-result-meta">
                          <div className="search-result-time">
                            {(() => {
                              const d = new Date(message.timestamp);
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const year = d.getFullYear();
                              return `${day}/${month}/${year} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                            })()}
                          </div>
                          {message.sessionName && (
                            <div className="search-result-session">
                              📂 {message.sessionName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          ) : (
            /* When not searching, show all messages normally */
            <>
              {messages.map((message: Message) => {
                const isSearchMatch = searchTerm && message.text.toLowerCase().includes(searchTerm.toLowerCase());
                return (
                  <div 
                    key={message.id} 
                    id={`message-${message.id}`}
                    className={`message ${message.sender}${isSearchMatch ? ' search-match' : ''}`}
                  >
                    <div className="message-avatar">
                      {message.sender === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="message-content">
                      <div>{highlightSearchTerm(message.text, searchTerm)}</div>
                      <div className="message-time">
                        <span>
                          {(() => {
                            const d = new Date(message.timestamp);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = d.getFullYear();
                            return `${day}/${month}/${year} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                          })()}
                        </span>                        <div className="message-action-buttons">
                          <button
                            className="copy-button"
                            title="Copy message"
                            onClick={() => copyToClipboard(message.text)}
                          >
                            <img src="/copy-document-svgrepo-com.svg" alt="copy" />
                          </button>
                          <button
                            className="tts-button"
                            title="Read out message"
                            onClick={() => speakMessage(message.text)}
                          >
                            <img src="/speaker-svgrepo-com.svg" alt="speaker" />
                          </button>
                          <button
                            className="delete-button"
                            title="Delete message"
                            onClick={() => onDeleteMessage && onDeleteMessage(message.id)}
                          >
                            <img src="/delete-svgrepo-com.svg" alt="delete" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
        </>
      )}
      <div ref={messagesEndRef} />
      
      {/* Toast notification */}
      {showToast && (
        <div className="toast">
          📋 Message copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default MessageList;
