/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ChatThread, Message } from '../types/message';
import { messageApi } from '../services/api/messageApi';
import { storageService } from '../services/storage/storageService';

interface MessageContextType {
  threads: ChatThread[];
  messages: Message[];
  activeThreadId: string | null;
  setActiveThreadId: (id: string | null) => void;
  sendMessage: (
    threadId: string,
    senderId: string,
    senderName: string,
    senderRole: Message['senderRole'],
    recipientId: string,
    text: string
  ) => Promise<void>;
  refreshMessages: () => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeThreadId, setActiveThreadIdState] = useState<string | null>(null);

  const setActiveThreadId = useCallback((threadId: string | null) => {
    setActiveThreadIdState(threadId);
    if (!threadId) {
      setMessages([]);
    }
  }, []);

  const refreshMessages = useCallback(() => {
    const token = storageService.getAuthToken();
    if (!token) return;

    messageApi
      .getThreads()
      .then((tList) => {
        setThreads(tList);
        if (tList.length > 0 && !activeThreadId) {
          setActiveThreadIdState(tList[0].id);
        }
      })
      .catch((err) => console.warn('Failed to load chat threads:', err));
  }, [activeThreadId]);

  useEffect(() => {
    refreshMessages();
  }, [refreshMessages]);

  useEffect(() => {
    if (!activeThreadId) {
      return;
    }
    const token = storageService.getAuthToken();
    if (!token) return;

    messageApi
      .getThreadMessages(activeThreadId)
      .then((msgs) => setMessages(msgs))
      .catch((err) => console.warn('Failed to load thread messages:', err));
  }, [activeThreadId]);

  const sendMessage = useCallback(
    async (
      threadId: string,
      _senderId: string,
      _senderName: string,
      _senderRole: Message['senderRole'],
      recipientId: string,
      text: string
    ) => {
      try {
        const savedMsg = await messageApi.sendMessage({
          recipientId,
          text,
          threadId: threadId || undefined
        });

        setMessages((prev) => [...prev, savedMsg]);

        setThreads((prevThreads) => {
          const exists = prevThreads.some((t) => t.id === savedMsg.threadId);
          if (exists) {
            return prevThreads.map((t) =>
              t.id === savedMsg.threadId
                ? {
                    ...t,
                    lastMessageText: text,
                    lastMessageTimestamp: savedMsg.timestamp
                  }
                : t
            );
          }
          return prevThreads;
        });
      } catch (err) {
        console.error('Error sending direct message:', err);
        throw err;
      }
    },
    []
  );

  return (
    <MessageContext.Provider
      value={{
        threads,
        messages,
        activeThreadId,
        setActiveThreadId,
        sendMessage,
        refreshMessages
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error('useMessages must be used within a MessageProvider');
  return ctx;
};
