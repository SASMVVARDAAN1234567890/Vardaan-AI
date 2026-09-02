import { User, ChatSession, Message, GroundingSource } from '../types';

const TOKEN_KEY = 'vardaan_auth_token';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

function getAuthHeaders(): HeadersInit {
  const token = authStorage.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // ================= Auth API =================
  async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    authStorage.setToken(data.token);
    return data;
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    authStorage.setToken(data.token);
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Unauthorized');
    return data.user;
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } finally {
      authStorage.removeToken();
    }
  },

  async updateProfile(updates: { name?: string; preferences?: any; avatar?: string }): Promise<User> {
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data.user;
  },

  async deleteAccount(): Promise<void> {
    const res = await fetch('/api/auth/account', {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete account');
    authStorage.removeToken();
  },

  // ================= Chats API =================
  async getChats(): Promise<ChatSession[]> {
    const res = await fetch('/api/chats', {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch chats');
    return data.chats;
  },

  async getChat(chatId: string): Promise<ChatSession> {
    const res = await fetch(`/api/chats/${chatId}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch chat session');
    return data.chat;
  },

  async createChat(title?: string): Promise<ChatSession> {
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create chat');
    return data.chat;
  },

  async updateChatTitle(chatId: string, title: string): Promise<ChatSession> {
    const res = await fetch(`/api/chats/${chatId}/title`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update chat title');
    return data.chat;
  },

  async togglePinChat(chatId: string): Promise<ChatSession> {
    const res = await fetch(`/api/chats/${chatId}/pin`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to pin chat');
    return data.chat;
  },

  async deleteChat(chatId: string): Promise<void> {
    const res = await fetch(`/api/chats/${chatId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete chat');
  },

  async clearChat(chatId: string): Promise<ChatSession> {
    const res = await fetch(`/api/chats/${chatId}/clear`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to clear chat');
    return data.chat;
  },

  async deleteAllChats(): Promise<void> {
    const res = await fetch('/api/chats', {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete all chats');
  },

  // ================= Streaming Chat Completion =================
  async streamChat({
    chatId,
    userMessage,
    useSearch = false,
    tone,
    regenerateMessageId,
    signal,
    onChunk,
    onSources,
    onTitleUpdate,
    onDone,
    onError,
  }: {
    chatId: string;
    userMessage?: Message;
    useSearch?: boolean;
    tone?: 'balanced' | 'concise' | 'detailed';
    regenerateMessageId?: string;
    signal?: AbortSignal;
    onChunk: (chunk: string, messageId: string) => void;
    onSources?: (sources: GroundingSource[]) => void;
    onTitleUpdate?: (newTitle: string) => void;
    onDone: (result: { messageId: string; content: string; sources?: GroundingSource[]; requestCount?: number }) => void;
    onError: (error: string) => void;
  }) {
    try {
      const token = authStorage.getToken();
      const response = await fetch(`/api/chats/${chatId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userMessage,
          useSearch,
          tone,
          regenerateMessageId,
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to start stream' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to stream response`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;

          let eventType = 'message';
          let dataStr = '';

          const blockLines = block.split('\n');
          for (const line of blockLines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.slice(6).trim();
            }
          }

          if (dataStr) {
            try {
              const parsed = JSON.parse(dataStr);
              if (eventType === 'chunk') {
                onChunk(parsed.text, parsed.messageId);
              } else if (eventType === 'sources') {
                onSources?.(parsed.sources);
              } else if (eventType === 'title_updated') {
                onTitleUpdate?.(parsed.title);
              } else if (eventType === 'done') {
                onDone(parsed);
              } else if (eventType === 'error') {
                onError(parsed.message || 'Error from AI service');
              }
            } catch (parseErr) {
              console.warn('Error parsing SSE data:', parseErr, dataStr);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        onError('Generation stopped by user.');
      } else {
        onError(err.message || 'Network error occurred during streaming.');
      }
    }
  },

  // ================= Image Generation API =================
  async generateImage(prompt: string, aspectRatio: string = '1:1', chatId?: string): Promise<{ imageUrl: string; prompt: string }> {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt, aspectRatio, chatId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate image');
    return data;
  },
};
