import type { ChatThread, Message } from '../../types/message';
import { request } from './apiClient';

export interface SendMessageInput {
  recipientId: string;
  text: string;
  threadId?: string;
}

export const messageApi = {
  getThreads: async (): Promise<ChatThread[]> => {
    return request<ChatThread[]>('/api/messages/threads');
  },

  getThreadMessages: async (threadId: string): Promise<Message[]> => {
    return request<Message[]>(`/api/messages/thread/${encodeURIComponent(threadId)}`);
  },

  sendMessage: async (input: SendMessageInput): Promise<Message> => {
    return request<Message>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }
};
