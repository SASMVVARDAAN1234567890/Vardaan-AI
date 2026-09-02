import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
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

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface MessageRecord {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    mimeType: string;
    base64?: string;
    previewUrl?: string;
  }>;
  isImageGen?: boolean;
  imageUrl?: string;
  error?: boolean;
  sources?: Array<{ title: string; uri: string }>;
}

export interface ChatRecord {
  id: string;
  userId: string;
  title: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
  messages: MessageRecord[];
}

interface DatabaseSchema {
  users: UserRecord[];
  sessions: SessionRecord[];
  chats: ChatRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'vardaan_store.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function loadDB(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB file, initializing fresh:', err);
  }
  const initial: DatabaseSchema = {
    users: [],
    sessions: [],
    chats: [],
  };
  saveDB(initial);
  return initial;
}

function saveDB(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

export const db = {
  createUser(name: string, email: string, password: string): { user: UserRecord; token: string } {
    const database = loadDB();
    const normalizedEmail = email.trim().toLowerCase();

    if (database.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const userId = 'usr_' + crypto.randomUUID();

    const newUser: UserRecord = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      salt,
      requestCount: 0,
      createdAt: new Date().toISOString(),
      preferences: {
        theme: 'system',
        language: 'auto',
        tone: 'balanced',
        searchGrounding: false,
      },
    };

    const token = 'vtok_' + crypto.randomBytes(32).toString('hex');
    const session: SessionRecord = {
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    database.users.push(newUser);
    database.sessions.push(session);
    saveDB(database);

    return { user: newUser, token };
  },

  authenticateUser(email: string, password: string): { user: UserRecord; token: string } {
    const database = loadDB();
    const normalizedEmail = email.trim().toLowerCase();
    const user = database.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const hash = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      throw new Error('Invalid email or password.');
    }

    const token = 'vtok_' + crypto.randomBytes(32).toString('hex');
    const session: SessionRecord = {
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    database.sessions.push(session);
    saveDB(database);

    return { user, token };
  },

  getUserByToken(token: string): UserRecord | null {
    if (!token) return null;
    const database = loadDB();
    const session = database.sessions.find(s => s.token === token);
    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
      // Session expired
      database.sessions = database.sessions.filter(s => s.token !== token);
      saveDB(database);
      return null;
    }

    const user = database.users.find(u => u.id === session.userId);
    return user || null;
  },

  deleteSession(token: string): boolean {
    const database = loadDB();
    database.sessions = database.sessions.filter(s => s.token !== token);
    saveDB(database);
    return true;
  },

  updateUser(userId: string, updates: Partial<UserRecord>): UserRecord {
    const database = loadDB();
    const userIndex = database.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const currentUser = database.users[userIndex];
    database.users[userIndex] = {
      ...currentUser,
      ...updates,
      id: currentUser.id, // prevent ID change
      email: currentUser.email, // prevent email mutation unless verified
    };
    saveDB(database);
    return database.users[userIndex];
  },

  incrementUserRequestCount(userId: string): number {
    const database = loadDB();
    const user = database.users.find(u => u.id === userId);
    if (user) {
      user.requestCount = (user.requestCount || 0) + 1;
      saveDB(database);
      return user.requestCount;
    }
    return 0;
  },

  deleteUser(userId: string): boolean {
    const database = loadDB();
    database.users = database.users.filter(u => u.id !== userId);
    database.sessions = database.sessions.filter(s => s.userId !== userId);
    database.chats = database.chats.filter(c => c.userId !== userId);
    saveDB(database);
    return true;
  },

  // CHAT OPERATIONS - STRICTLY SCOPED TO USER ID
  getChatsForUser(userId: string): ChatRecord[] {
    const database = loadDB();
    return database.chats
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getChatById(chatId: string, userId: string): ChatRecord | null {
    const database = loadDB();
    const chat = database.chats.find(c => c.id === chatId && c.userId === userId);
    return chat || null;
  },

  createChat(userId: string, title?: string): ChatRecord {
    const database = loadDB();
    const newChat: ChatRecord = {
      id: 'chat_' + crypto.randomUUID(),
      userId,
      title: title?.trim() || 'New Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    database.chats.unshift(newChat);
    saveDB(database);
    return newChat;
  },

  updateChatTitle(chatId: string, userId: string, newTitle: string): ChatRecord {
    const database = loadDB();
    const chat = database.chats.find(c => c.id === chatId && c.userId === userId);
    if (!chat) throw new Error('Chat not found or unauthorized');
    chat.title = newTitle.trim();
    chat.updatedAt = new Date().toISOString();
    saveDB(database);
    return chat;
  },

  togglePinChat(chatId: string, userId: string): ChatRecord {
    const database = loadDB();
    const chat = database.chats.find(c => c.id === chatId && c.userId === userId);
    if (!chat) throw new Error('Chat not found or unauthorized');
    chat.pinned = !chat.pinned;
    saveDB(database);
    return chat;
  },

  saveMessage(chatId: string, userId: string, message: MessageRecord): ChatRecord {
    const database = loadDB();
    const chat = database.chats.find(c => c.id === chatId && c.userId === userId);
    if (!chat) throw new Error('Chat not found or unauthorized');

    // Check if message with this id exists (update it) or push new
    const existingIndex = chat.messages.findIndex(m => m.id === message.id);
    if (existingIndex >= 0) {
      chat.messages[existingIndex] = message;
    } else {
      chat.messages.push(message);
    }

    // Auto-update title if it's the first message and title is default
    if (chat.messages.length === 1 && message.role === 'user' && chat.title === 'New Chat') {
      const generated = message.content.slice(0, 36).replace(/\n/g, ' ').trim();
      if (generated) {
        chat.title = generated.length > 30 ? generated.slice(0, 30) + '...' : generated;
      }
    }

    chat.updatedAt = new Date().toISOString();
    saveDB(database);
    return chat;
  },

  deleteChat(chatId: string, userId: string): boolean {
    const database = loadDB();
    const initialCount = database.chats.length;
    database.chats = database.chats.filter(c => !(c.id === chatId && c.userId === userId));
    saveDB(database);
    return database.chats.length < initialCount;
  },

  clearChatMessages(chatId: string, userId: string): ChatRecord {
    const database = loadDB();
    const chat = database.chats.find(c => c.id === chatId && c.userId === userId);
    if (!chat) throw new Error('Chat not found or unauthorized');
    chat.messages = [];
    chat.updatedAt = new Date().toISOString();
    saveDB(database);
    return chat;
  },

  deleteAllChatsForUser(userId: string): number {
    const database = loadDB();
    const initialCount = database.chats.filter(c => c.userId === userId).length;
    database.chats = database.chats.filter(c => c.userId !== userId);
    saveDB(database);
    return initialCount;
  },
};
