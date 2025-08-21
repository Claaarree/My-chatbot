import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatSession } from './types';
import { MockAIService } from './mockAI';


const LOCAL_STORAGE_KEY = 'mychatbot_sessions';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback to default if corrupted
        return [{ id: 'session-1', name: 'Chat 1', messages: [] }];
      }
    }
    return [{ id: 'session-1', name: 'Chat 1', messages: [] }];
  });
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const sessions = JSON.parse(saved);
        return sessions[0]?.id || 'session-1';
      } catch {
        return 'session-1';
      }
    }
    return 'session-1';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persist sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // Reselects text box after getting a response
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    setSessions((prev) => prev.map(session => {
      if (session.id === activeSessionId) {
        // If this is the first user message, rename the tab
        if (session.messages.length === 0) {
          const firstWord = text.trim().split(/\s+/)[0];
          return { ...session, messages: [userMessage], name: firstWord };
        }
        return { ...session, messages: [...session.messages, userMessage] };
      }
      return session;
    }));
    setIsLoading(true);
    setInputText('');
    try {
      const aiResponse = await MockAIService.getResponse(text.trim());
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.response,
        sender: 'bot',
        timestamp: new Date()
      };
      setSessions((prev) => prev.map(session =>
        session.id === activeSessionId
          ? { ...session, messages: [...session.messages, botMessage] }
          : session
      ));
      setIsLoading(false);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error while processing your request. Please try again! 😅",
        sender: 'bot',
        timestamp: new Date()
      };
      setSessions((prev) => prev.map(session =>
        session.id === activeSessionId
          ? { ...session, messages: [...session.messages, errorMessage] }
          : session
      ));
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const handleNewSession = () => {
    const newId = `session-${Date.now()}`;
    setSessions(prev => [...prev, { id: newId, name: `Chat ${prev.length + 1}`, messages: [] }]);
    setActiveSessionId(newId);
  };

  const handleSwitchSession = (id: string) => {
    setActiveSessionId(id);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
    setInputText('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);
  return (
    <div className="app">
      <header className="header">
        <h1>🤖 My Chatbot</h1>
        <p>Your friendly AI assistant answering questions since 2022</p>
      </header>

      <div className="session-tabs">
        {sessions.map(session => (
          <div key={session.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              className={`session-tab${session.id === activeSessionId ? ' active' : ''}`}
              onClick={() => handleSwitchSession(session.id)}
            >
              {session.name}
            </button>
            {sessions.length > 1 && (
              <button
                className="session-tab-close"
                title="Delete chat"
                onClick={() => {
                  const idx = sessions.findIndex(s => s.id === session.id);
                  const newSessions = sessions.filter(s => s.id !== session.id);
                  setSessions(newSessions);
                  // If deleting active, switch to previous or next
                  if (activeSessionId === session.id) {
                    if (newSessions.length > 0) {
                      const newIdx = idx > 0 ? idx - 1 : 0;
                      setActiveSessionId(newSessions[newIdx].id);
                    }
                  }
                }}
                style={{ position: 'absolute', right: 4, top: 4, width: 18, height: 18, border: 'none', background: 'transparent', color: '#888', fontSize: 14, cursor: 'pointer', borderRadius: '50%' }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button className="session-tab new-session" onClick={handleNewSession} title="Start new chat">
          ＋
        </button>
      </div>

      <div className="chat-container">
        <div className="messages-area">
          {activeSession && activeSession.messages.length === 0 ? (
            <div className="empty-state">
              <h3>👋 Welcome to My Chatbot!</h3>
              <p>
                I'm here to chat with you! Ask me anything or try one of these suggestions:
              </p>
              <div className="suggestions">
                {MockAIService.getSuggestedQuestions().map((suggestion: string, index: number) => (
                  <button
                    key={index}
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {activeSession && activeSession.messages.map((message: Message) => (
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

        <div className="input-area">
          <form onSubmit={handleSubmit} className="input-form">
            <div className="input-wrapper">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here... (Press Enter to send)"
                className="message-input"
                disabled={isLoading}
                rows={1}
              />
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
      </div>
    </div>
  );
};

export default App;
