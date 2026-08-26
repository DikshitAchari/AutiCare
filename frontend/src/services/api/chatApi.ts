import { request } from './apiClient';

export const chatApi = {
  sendMessage: (message: string): Promise<{ response: string; disclaimer: string }> =>
    request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    }),

  getHistory: (): Promise<Array<{ id: number; role: string; message: string; created_at?: string }>> =>
    request('/api/chat/history')
};
