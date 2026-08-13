export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: 'PARENT' | 'THERAPIST' | 'ADMIN';
  recipientId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ChatThread {
  id: string;
  parentId: string;
  parentName: string;
  parentAvatar?: string;
  therapistId: string;
  therapistName: string;
  therapistAvatar?: string;
  childName?: string;
  lastMessageText: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}
