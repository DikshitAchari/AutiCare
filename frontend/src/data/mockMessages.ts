import type { ChatThread, Message } from '../types/message';

export const INITIAL_THREADS: ChatThread[] = [
  {
    id: 'TH001',
    parentId: 'P001',
    parentName: 'Sunita Sharma',
    parentAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    therapistId: 'T001',
    therapistName: 'Dr. Priya Sharma',
    therapistAvatar: 'https://images.unsplash.com/photo-1594824813566-88855ce78341?w=150&auto=format&fit=crop&q=80',
    lastMessageText: 'Hello Sunita, I reviewed Aarav\'s latest screening response. Let\'s discuss during our upcoming Wednesday session.',
    lastMessageTimestamp: '2026-08-10T11:20:00Z',
    unreadCount: 1
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'MSG001',
    threadId: 'TH001',
    senderId: 'P001',
    senderName: 'Sunita Sharma',
    senderRole: 'PARENT',
    recipientId: 'T001',
    text: 'Good morning Dr. Priya! I completed Aarav\'s updated behavioral screening questionnaire.',
    timestamp: '2026-08-10T10:15:00Z',
    read: true
  },
  {
    id: 'MSG002',
    threadId: 'TH001',
    senderId: 'T001',
    senderName: 'Dr. Priya Sharma',
    senderRole: 'THERAPIST',
    recipientId: 'P001',
    text: 'Hello Sunita, I reviewed Aarav\'s latest screening response. Let\'s discuss during our upcoming Wednesday session.',
    timestamp: '2026-08-10T11:20:00Z',
    read: false
  }
];
