export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  requestCount: number;
  createdAt: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: 'auto' | 'en' | 'hi' | 'hinglish';
    tone?: 'balanced' | 'concise' | 'detailed';
    searchGrounding?: boolean;
  };
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  mimeType: string;
  base64?: string; // base64 encoded data
  previewUrl?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  isImageGen?: boolean;
  imageUrl?: string;
  error?: boolean;
  sources?: GroundingSource[];
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface AuthResponse {
  user: User;
  token: string;
}
