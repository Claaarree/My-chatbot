import React from 'react';
import { ChatSession } from './types';

interface SessionTabsProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSwitch: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

const SessionTabs: React.FC<SessionTabsProps> = ({ sessions, activeSessionId, onSwitch, onNew, onDelete }) => (
  <div className="session-tabs">
    {sessions.map(session => (
      <div key={session.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
            style={{ position: 'absolute', right: 4, top: 4, width: 24, height: 24, border: 'none', background: 'transparent', color: '#888', fontSize: 20, cursor: 'pointer', borderRadius: '50%' }}
          >
            ×
          </button>
        )}
      </div>
    ))}
    <button className="session-tab new-session" onClick={onNew} title="Start new chat">
      ＋
    </button>
  </div>
);

export default SessionTabs;
