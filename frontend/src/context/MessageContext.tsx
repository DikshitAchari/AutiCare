import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ChatThread, Message } from '../types/message';
import { storageService } from '../services/storage/storageService';

interface MessageContextType {
  threads: ChatThread[];
  messages: Message[];
  activeThreadId: string | null;
  setActiveThreadId: (id: string | null) => void;
  sendMessage: (threadId: string, senderId: string, senderName: string, senderRole: Message['senderRole'], recipientId: string, text: string) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [threads, setThreads] = useState<ChatThread[]>(() => storageService.getThreads());
  const [messages, setMessages] = useState<Message[]>(() => storageService.getMessages());
  const [activeThreadId, setActiveThreadId] = useState<string | null>(threads[0]?.id || null);

  const sendMessage = useCallback(
    (threadId: string, senderId: string, senderName: string, senderRole: Message['senderRole'], recipientId: string, text: string) => {
      const newMsg: Message = {
        id: `MSG${Date.now().toString().slice(-5)}`,
        threadId,
        senderId,
        senderName,
        senderRole,
        recipientId,
        text,
        timestamp: new Date().toISOString(),
        read: true
      };

      const updatedMessages = [...messages, newMsg];
      setMessages(updatedMessages);
      storageService.saveMessages(updatedMessages);

      const updatedThreads = threads.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            lastMessageText: text,
            lastMessageTimestamp: newMsg.timestamp
          };
        }
        return t;
      });

      setThreads(updatedThreads);
      storageService.saveThreads(updatedThreads);
    },
    [threads, messages]
  );

  return (
    <MessageContext.Provider value={{ threads, messages, activeThreadId, setActiveThreadId, sendMessage }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error('useMessages must be used within a MessageProvider');
  return ctx;
};
