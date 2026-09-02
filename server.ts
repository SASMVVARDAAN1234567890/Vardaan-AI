import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db.js';
import {
  generateChatResponseStream,
  generateChatTitle,
  generateImage,
  ChatMessageParam,
} from './server/gemini.js';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing json with up to 50MB for file/image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Authentication middleware helper
interface AuthenticatedRequest extends Request {
  user?: ReturnType<typeof db.getUserByToken>;
  token?: string;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  const user = db.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  req.user = user;
  req.token = token;
  next();
}

// ==================== AUTH ROUTES ====================

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const { user, token } = db.createUser(name, email, password);
    const { passwordHash, salt, ...safeUser } = user;
    res.status(201).json({ user: safeUser, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to register account.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { user, token } = db.authenticateUser(email, password);
    const { passwordHash, salt, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid email or password.' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { passwordHash, salt, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.token) {
    db.deleteSession(req.token);
  }
  res.json({ success: true });
});

app.patch('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { name, preferences, avatar } = req.body;
    const updated = db.updateUser(user.id, {
      ...(name ? { name } : {}),
      ...(preferences ? { preferences: { ...user.preferences, ...preferences } } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
    });
    const { passwordHash, salt, ...safeUser } = updated;
    res.json({ user: safeUser });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update profile.' });
  }
});

app.delete('/api/auth/account', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    db.deleteUser(user.id);
    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete account.' });
  }
});

// ==================== CHAT ROUTES ====================

// List all chats for current authenticated user
app.get('/api/chats', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const chats = db.getChatsForUser(user.id);
  res.json({ chats });
});

// Create a new chat
app.post('/api/chats', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { title } = req.body;
  const newChat = db.createChat(user.id, title);
  res.status(201).json({ chat: newChat });
});

// Get single chat by ID
app.get('/api/chats/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const chat = db.getChatById(req.params.id, user.id);
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found or access denied.' });
  }
  res.json({ chat });
});

// Update chat title
app.patch('/api/chats/:id/title', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title cannot be empty.' });
    }
    const updated = db.updateChatTitle(req.params.id, user.id, title);
    res.json({ chat: updated });
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Failed to rename chat.' });
  }
});

// Toggle pin chat
app.patch('/api/chats/:id/pin', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const updated = db.togglePinChat(req.params.id, user.id);
    res.json({ chat: updated });
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Failed to update pin.' });
  }
});

// Delete single chat
app.delete('/api/chats/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const deleted = db.deleteChat(req.params.id, user.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Chat not found or access denied.' });
  }
  res.json({ success: true });
});

// Clear all messages in single chat
app.post('/api/chats/:id/clear', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const updated = db.clearChatMessages(req.params.id, user.id);
    res.json({ chat: updated });
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Failed to clear chat.' });
  }
});

// Delete all chats for user
app.delete('/api/chats', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const count = db.deleteAllChatsForUser(user.id);
  res.json({ success: true, count });
});

// Generate smart title from user message
app.post('/api/chats/:id/generate-title', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message required.' });
    }
    const generatedTitle = await generateChatTitle(message);
    const updated = db.updateChatTitle(req.params.id, user.id, generatedTitle);
    res.json({ title: generatedTitle, chat: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate title.' });
  }
});

// ==================== STREAMING CHAT COMPLETION ====================

app.post('/api/chats/:id/stream', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const chatId = req.params.id;

  // Verify chat ownership
  let chat = db.getChatById(chatId, user.id);
  if (!chat) {
    return res.status(404).json({ error: 'Chat session not found.' });
  }

  const {
    userMessage,
    useSearch,
    tone,
    regenerateMessageId,
  } = req.body;

  // Increment user request usage counter
  const newCount = db.incrementUserRequestCount(user.id);

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Save or update user message
    if (userMessage) {
      db.saveMessage(chatId, user.id, {
        id: userMessage.id || 'msg_' + Date.now(),
        role: 'user',
        content: userMessage.content || '',
        timestamp: userMessage.timestamp || Date.now(),
        attachments: userMessage.attachments || [],
      });
    }

    // Refresh chat messages
    chat = db.getChatById(chatId, user.id)!;

    // Filter message history
    let messageHistory = [...chat.messages];
    if (regenerateMessageId) {
      const idx = messageHistory.findIndex(m => m.id === regenerateMessageId);
      if (idx !== -1) {
        messageHistory = messageHistory.slice(0, idx);
      }
    }

    // Prepare parameters for Gemini
    const geminiMessages: ChatMessageParam[] = messageHistory.map(m => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments?.map(a => ({
        mimeType: a.mimeType,
        base64: a.base64,
        name: a.name,
      })),
    }));

    sendEvent('status', { status: 'generating', requestCount: newCount });

    let collectedText = '';
    let collectedSources: Array<{ title: string; uri: string }> = [];

    const assistantMsgId = 'asst_' + Date.now();

    await generateChatResponseStream(geminiMessages, {
      useSearch: !!useSearch,
      tone: tone || user.preferences?.tone,
      customSystemPrompt: undefined,
      onChunk: (chunkText) => {
        collectedText += chunkText;
        sendEvent('chunk', { text: chunkText, messageId: assistantMsgId });
      },
      onGrounding: (sources) => {
        collectedSources = sources;
        sendEvent('sources', { sources });
      },
    });

    // Save final assistant message to database
    db.saveMessage(chatId, user.id, {
      id: assistantMsgId,
      role: 'assistant',
      content: collectedText,
      timestamp: Date.now(),
      sources: collectedSources.length > 0 ? collectedSources : undefined,
    });

    // If chat title is still "New Chat" or first exchange, auto-title in background
    if (chat.messages.length <= 2 && (chat.title === 'New Chat' || !chat.title)) {
      const firstUserMsg = chat.messages.find(m => m.role === 'user');
      if (firstUserMsg?.content) {
        generateChatTitle(firstUserMsg.content)
          .then(newTitle => {
            db.updateChatTitle(chatId, user.id, newTitle);
            sendEvent('title_updated', { title: newTitle });
          })
          .catch(() => {});
      }
    }

    sendEvent('done', {
      messageId: assistantMsgId,
      content: collectedText,
      sources: collectedSources,
      requestCount: newCount,
    });
    res.end();
  } catch (err: any) {
    console.error('Error in chat stream:', err);
    sendEvent('error', {
      message: err.message || 'An error occurred while generating the AI response.',
    });
    res.end();
  }
});

// ==================== IMAGE GENERATION ROUTE ====================

app.post('/api/generate-image', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { prompt, aspectRatio, chatId } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required for image generation.' });
    }

    db.incrementUserRequestCount(user.id);

    const result = await generateImage(prompt, aspectRatio || '1:1');

    // If a chatId was provided, persist the image message to the chat
    if (chatId) {
      const chat = db.getChatById(chatId, user.id);
      if (chat) {
        const imageMsgId = 'img_' + Date.now();
        db.saveMessage(chatId, user.id, {
          id: imageMsgId,
          role: 'assistant',
          content: `🎨 Generated Image: **${prompt}**`,
          timestamp: Date.now(),
          isImageGen: true,
          imageUrl: result.imageUrl,
        });
      }
    }

    res.json(result);
  } catch (err: any) {
    console.error('Image generation error:', err);
    res.status(500).json({
      error: err.message || 'Failed to generate image. Please check API configuration or try another prompt.',
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Vardaan AI',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Vite Middleware for Development / Static serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Vardaan AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
