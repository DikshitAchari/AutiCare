import React from 'react';
import { ChatBox } from '../../components/messages/ChatBox';

export const ParentMessagesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Clinical Messages</h1>
        <p className="text-xs text-slate-500">Communicate directly with your assigned certified therapists</p>
      </div>

      <ChatBox />
    </div>
  );
};
