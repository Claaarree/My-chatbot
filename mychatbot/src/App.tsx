import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatSession } from './types';
import { MockAIService } from './mockAI';
import SessionTabs from './SessionTabs';
import MessageList from './MessageList';
import InputArea from './InputArea';


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

  // const handleSuggestionClick = (suggestion: string) => {
  //   sendMessage(suggestion);
  //   setInputText('');
  //   inputRef.current?.focus();
  // };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement> | string) => {
  if (typeof e === 'string') {
    setInputText(e);
  } else {
    setInputText(e.target.value);
  }
};

  const activeSession = sessions.find(s => s.id === activeSessionId);
  return (
    <div className="app">
      <header className="header">
        <h1>🤖 My Chatbot</h1>
        <p>Your friendly AI assistant answering questions since 2022</p>
      </header>

      <SessionTabs
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSwitch={handleSwitchSession}
        onNew={handleNewSession}
        onDelete={(id: string) => {
          const idx = sessions.findIndex(s => s.id === id);
          const newSessions = sessions.filter(s => s.id !== id);
          setSessions(newSessions);
          if (activeSessionId === id && newSessions.length > 0) {
            const newIdx = idx > 0 ? idx - 1 : 0;
            setActiveSessionId(newSessions[newIdx].id);
          }
        }}
      />

      <div className="chat-container">
        <MessageList
          messages={activeSession ? activeSession.messages : []}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
          suggestions={MockAIService.getSuggestedQuestions()}
          onSuggestionClick={(suggestion: string) => {
            sendMessage(suggestion);
            setInputText('');
            inputRef.current?.focus();
          }}
        />
        <InputArea
          inputText={inputText}
          onInputChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          inputRef={inputRef}
        />
      </div>
      
    </div>
  );
};

export default App;
