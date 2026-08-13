import React from 'react';
import { ChatBox } from '../../components/messages/ChatBox';

export const TherapistMessagesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Patient Parent Messaging</h1>
        <p className="text-xs text-slate-500">Secure clinical chat interface with parents</p>
      </div>

      <ChatBox />
    </div>
  );
};
