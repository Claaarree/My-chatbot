import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, ChatSession } from './types';
import { MockAIService } from './mockAI';
import SessionTabs from './SessionTabs';
import MessageList from './MessageList';
import InputArea from './InputArea';
import { saveFileWithPicker, getExportContent, exportSessionAsPDF } from './ChatExport';

const LOCAL_STORAGE_KEY = 'mychatbot_sessions';

// Utility function to create session name that fits in the tab
const createSessionName = (text: string): string => {
  const maxLength = 18; // Shorter limit to account for close button space
  const cleanText = text.trim();
  
  if (cleanText.length <= maxLength) {
    return cleanText;
  }
  
  // Truncate at the last complete word that fits
  const truncated = cleanText.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > 0 && lastSpaceIndex > maxLength * 0.6) {
    // If we found a space and it's not too early, cut at the last word
    return truncated.substring(0, lastSpaceIndex) + '...';
  } else {
    // Otherwise, just truncate and add ellipsis
    return truncated + '...';
  }
};

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
  });  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
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
  // Close sidebar when clicking outside (on overlay)
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleClick = (e: MouseEvent) => {
      const sidebar = document.querySelector('.sidebar');
      const toggleBtn = document.querySelector('.sidebar-toggle');
      if (
        sidebarOpen &&
        sidebar &&
        !sidebar.contains(e.target as Node) &&
        toggleBtn &&
        !toggleBtn.contains(e.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);    return () => document.removeEventListener('mousedown', handleClick);
  }, [sidebarOpen]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    if (!showExportDropdown) return;
    const handleClick = (e: MouseEvent) => {
      const dropdown = document.querySelector('.export-dropdown-container');
      if (dropdown && !dropdown.contains(e.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showExportDropdown]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };    setSessions((prev) => prev.map(session => {
      if (session.id === activeSessionId) {
        // If this is the first user message, rename the tab
        if (session.messages.length === 0) {
          const sessionName = createSessionName(text.trim());
          return { ...session, messages: [userMessage], name: sessionName };
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
    }  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };
  const handleNewSession = () => {
    const newId = `session-${Date.now()}`;
    setSessions(prev => [...prev, { id: newId, name: `Chat ${prev.length + 1}`, messages: [] }]);
    setActiveSessionId(newId);
    setSearchTerm(''); // Clear search when creating new session
  };
  const handleSwitchSession = (id: string) => {
    setActiveSessionId(id);
    setSearchTerm(''); // Clear search when switching sessions
  };

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
  
  // Search functionality - search across ALL sessions
  const filteredMessages = useMemo(() => {
    if (!searchTerm.trim()) {
      return activeSession?.messages || [];
    }
    
    // Search through all sessions and flatten results
    const allMatchingMessages: (Message & { sessionId: string; sessionName: string })[] = [];
    
    sessions.forEach(session => {
      const matchingMessages = session.messages.filter(message =>
        message.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Add session info to each matching message
      matchingMessages.forEach(message => {
        allMatchingMessages.push({
          ...message,
          sessionId: session.id,
          sessionName: session.name
        });
      });
    });
    
    // Sort by timestamp (most recent first)
    return allMatchingMessages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [sessions, searchTerm]);
  const clearSearch = () => {
    setSearchTerm('');
  };
  const handleJumpToMessage = (messageId: string, sessionId?: string) => {
    // If message is from a different session, switch to that session first
    if (sessionId && sessionId !== activeSessionId) {
      setActiveSessionId(sessionId);
    }
    
    // Clear search to show all messages
    clearSearch();
    
    // Wait for re-render then scroll to message
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Add temporary highlight effect
        messageElement.classList.add('message-highlighted');
        setTimeout(() => {
          messageElement.classList.remove('message-highlighted');
        }, 2000);
      }    }, 100);
  };  
  const handleDeleteMessage = (messageId: string) => {
    setSessions(prev => 
      prev.map(session => ({
        ...session,
        messages: session.messages.filter(message => message.id !== messageId)
      }))
    );
  };

  const exportChatInFormat = async (format: 'json' | 'txt' | 'csv' | 'pdf') => {
    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;
    const timestamp = new Date().toISOString().split('T')[0];
    const sessionNameClean = currentSession.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    if (format === 'pdf') {
      const filename = `chat-${sessionNameClean}-${timestamp}.pdf`;
      const saveResult = await exportSessionAsPDF(currentSession, filename);
      setShowExportDropdown(false);
      if (saveResult !== 'success') return;
      return;
    }
    const { content, mimeType, fileExtension } = getExportContent(currentSession, format);
    const filename = `chat-${sessionNameClean}-${timestamp}.${fileExtension}`;
    const blob = new Blob([content], { type: mimeType });
    const saveResult = await saveFileWithPicker(blob, filename, mimeType);
    setShowExportDropdown(false);
    if (saveResult === 'success' || saveResult === 'cancelled') return;
    // Fallback to regular download only if unsupported
    const dataUri = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    linkElement.click();
  };

  const handleExportButtonClick = () => {
    setShowExportDropdown(!showExportDropdown);
  };
  
  return (
    <div className={`app app-with-drawer${sidebarOpen ? '' : ' sidebar-closed'}`}> 
      {/* Overlay for closing sidebar on click */}      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className="sidebar">
        <div className="sidebar-header">          <button
            className="sidebar-header-btn sidebar-plus-btn"
            onClick={handleNewSession}
            title="Start new chat"
            aria-label="Start new chat"
          >
            ✕
          </button>
          <button
            className="sidebar-header-btn sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>
        <SessionTabs
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSwitch={handleSwitchSession}
          onDelete={(id: string) => {
            const idx = sessions.findIndex(s => s.id === id);
            const newSessions = sessions.filter(s => s.id !== id);
            setSessions(newSessions);
            if (activeSessionId === id && newSessions.length > 0) {
              const newIdx = idx > 0 ? idx - 1 : 0;
              setActiveSessionId(newSessions[newIdx].id);
            }
          }}
          onNew={() => {}}
        />
      </aside>      <div className="chat-main">        <header className="header">
          <button
            className="sidebar-toggle-left"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen ? '❮' : '❯'}
          </button>
          <h1>🤖 My Chatbot</h1>
          <p>Your friendly AI assistant</p><div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="search-clear-btn"
                  onClick={clearSearch}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="search-results-info">
                {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
              </div>
            )}          </div>          <div className="header-actions">
            <div className="export-dropdown-container">
              <button
                className="export-button"
                onClick={handleExportButtonClick}
                title="Export current chat"
                aria-label="Export current chat"
              >
                <img src="/export-svgrepo-com.svg" alt="export" />
              </button>              {showExportDropdown && (
                <div className="export-dropdown">
                  <button onClick={() => exportChatInFormat('json')}>Export as JSON</button>
                  <button onClick={() => exportChatInFormat('txt')}>Export as TXT</button>
                  <button onClick={() => exportChatInFormat('csv')}>Export as CSV</button>
                  <button onClick={() => exportChatInFormat('pdf')}>Export as PDF</button>
                </div>
              )}
            </div>
          </div>
        </header><div className="chat-container">          
          <MessageList
            messages={searchTerm ? filteredMessages : activeSession?.messages || []}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
            suggestions={MockAIService.getSuggestedQuestions()}
            searchTerm={searchTerm}
            filteredMessages={filteredMessages}
            onJumpToMessage={handleJumpToMessage}
            onDeleteMessage={handleDeleteMessage}
            onSuggestionClick={(suggestion: string) => {
              sendMessage(suggestion);
              setInputText('');
              inputRef.current?.focus();
            }}
            onNewChat={() => {
              setSearchTerm(''); // Clear search
              handleNewSession(); // Start new session
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
    </div>
  );
};

export default App;
