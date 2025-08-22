import React from 'react';
import { ChatSession } from './types';

interface SessionTabsProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSwitch: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

const SessionTabs: React.FC<SessionTabsProps> = ({ sessions, activeSessionId, onSwitch, onDelete }) => (
  <div className="session-tabs">
    {sessions.map(session => (
      <div key={session.id} className="session-tab-wrapper">
        <button
          className={`session-tab${session.id === activeSessionId ? ' active' : ''}`}
          onClick={() => onSwitch(session.id)}
        >
          {session.name}
        </button>
        {sessions.length > 1 && (
          <button
            className="session-tab-close"
            title="Delete chat"
            onClick={() => onDelete(session.id)}
          >
            ×
          </button>
        )}
      </div>
    ))}
    {/* Removed new chat button from here */}
  </div>
);

export default SessionTabs;
