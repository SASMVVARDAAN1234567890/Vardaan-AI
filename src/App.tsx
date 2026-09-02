import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, ChatSession, Message, Attachment, GroundingSource } from './types';
import { api, authStorage } from './services/api';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatComposer } from './components/ChatComposer';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SettingsModal } from './components/SettingsModal';
import { VardaanLogo } from './components/VardaanLogo';
import {
  Menu,
  Plus,
  Sparkles,
  AlertCircle,
  X,
  Share2,
  Trash2,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [globalError, setGlobalError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize theme from storage or system
  useEffect(() => {
    const savedTheme = localStorage.getItem('vardaan_theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSetTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('vardaan_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleToggleTheme = () => {
    handleSetTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Verify authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = authStorage.getToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const currentUser = await api.getMe();
        setUser(currentUser);
        // Load user preferences
        if (currentUser.preferences?.theme && currentUser.preferences.theme !== 'system') {
          handleSetTheme(currentUser.preferences.theme as 'light' | 'dark');
        }
      } catch (err) {
        authStorage.removeToken();
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch chats when user logs in
  const loadChats = useCallback(async () => {
    if (!user) return;
    try {
      const userChats = await api.getChats();
      setChats(userChats);
      if (userChats.length > 0 && !activeChatId) {
        setActiveChatId(userChats[0].id);
        setMessages(userChats[0].messages || []);
      }
    } catch (err: any) {
      console.error('Error fetching chats:', err);
    }
  }, [user, activeChatId]);

  useEffect(() => {
    if (user) {
      loadChats();
    } else {
      setChats([]);
      setActiveChatId(null);
      setMessages([]);
    }
  }, [user, loadChats]);

  // Load active chat messages when activeChatId changes
  useEffect(() => {
    if (!activeChatId || !user) return;
    const activeChat = chats.find((c) => c.id === activeChatId);
    if (activeChat) {
      setMessages(activeChat.messages || []);
    } else {
      api
        .getChat(activeChatId)
        .then((chat) => {
          setMessages(chat.messages || []);
        })
        .catch(() => {
          setActiveChatId(null);
          setMessages([]);
        });
    }
  }, [activeChatId, chats, user]);

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isStreaming]);

  // Keyboard shortcut (⌘K or Ctrl+K for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewChat();
      }
      if (e.key === 'Escape') {
        setSettingsOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chats]);

  // Chat Operations
  const handleNewChat = async () => {
    if (!user) return;
    try {
      const newChat = await api.createChat('New Chat');
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setMessages([]);
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to create new chat');
    }
  };

  const handleSelectChat = (chatId: string) => {
    if (chatId === activeChatId) return;
    setActiveChatId(chatId);
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      const updated = await api.updateChatTitle(chatId, newTitle);
      setChats((prev) => prev.map((c) => (c.id === chatId ? updated : c)));
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to rename chat');
    }
  };

  const handleTogglePinChat = async (chatId: string) => {
    try {
      const updated = await api.togglePinChat(chatId);
      setChats((prev) => prev.map((c) => (c.id === chatId ? updated : c)));
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to pin chat');
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await api.deleteChat(chatId);
      const remaining = chats.filter((c) => c.id !== chatId);
      setChats(remaining);
      if (activeChatId === chatId) {
        if (remaining.length > 0) {
          setActiveChatId(remaining[0].id);
          setMessages(remaining[0].messages || []);
        } else {
          setActiveChatId(null);
          setMessages([]);
        }
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to delete chat');
    }
  };

  const handleClearCurrentChat = async () => {
    if (!activeChatId) return;
    try {
      const updated = await api.clearChat(activeChatId);
      setMessages([]);
      setChats((prev) => prev.map((c) => (c.id === activeChatId ? updated : c)));
      setSettingsOpen(false);
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to clear chat');
    }
  };

  const handleDeleteAllChats = async () => {
    try {
      await api.deleteAllChats();
      setChats([]);
      setActiveChatId(null);
      setMessages([]);
      setSettingsOpen(false);
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to delete all chats');
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // SEND MESSAGE HANDLER
  const handleSendMessage = async (
    text: string,
    attachments: Attachment[],
    options?: { useSearch?: boolean; isImageGen?: boolean }
  ) => {
    if (!user) return;
    setGlobalError(null);

    let currentChatId = activeChatId;

    // Auto-create chat if none active
    if (!currentChatId) {
      try {
        const titleSeed = text ? text.slice(0, 30) : 'New Chat';
        const newChat = await api.createChat(titleSeed);
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        currentChatId = newChat.id;
      } catch (err: any) {
        setGlobalError('Could not initialize chat session.');
        return;
      }
    }

    const userMessageId = 'msg_' + Date.now();
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    // Append user message immediately to state
    setMessages((prev) => [...prev, userMessage]);

    // Handle Image Generation Mode
    if (options?.isImageGen) {
      setIsStreaming(true);
      const assistantPlaceholderId = 'asst_' + Date.now();
      const assistantMessage: Message = {
        id: assistantPlaceholderId,
        role: 'assistant',
        content: `🎨 Generating visual image for: **${text}**...`,
        timestamp: Date.now(),
        isImageGen: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const imgResult = await api.generateImage(text, '1:1', currentChatId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantPlaceholderId
              ? {
                  ...m,
                  content: `🎨 Generated Image: **${text}**`,
                  imageUrl: imgResult.imageUrl,
                }
              : m
          )
        );
        setUser((prev) => prev ? { ...prev, requestCount: (prev.requestCount || 0) + 1 } : prev);
      } catch (imgErr: any) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantPlaceholderId
              ? {
                  ...m,
                  content: `Image generation notice: ${imgErr.message || 'Image generation is currently unavailable for this prompt.'}`,
                  error: true,
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    // Handle Normal Text / Multimodal Streaming
    setIsStreaming(true);
    const assistantMsgId = 'asst_' + Date.now();
    let streamContent = '';

    // Create assistant placeholder message
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, initialAssistantMsg]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    await api.streamChat({
      chatId: currentChatId,
      userMessage,
      useSearch: options?.useSearch,
      tone: user.preferences?.tone,
      signal: controller.signal,
      onChunk: (chunk) => {
        streamContent += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: streamContent } : m
          )
        );
      },
      onSources: (sources: GroundingSource[]) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, sources } : m
          )
        );
      },
      onTitleUpdate: (newTitle) => {
        setChats((prev) =>
          prev.map((c) => (c.id === currentChatId ? { ...c, title: newTitle } : c))
        );
      },
      onDone: (result) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        if (result.requestCount !== undefined) {
          setUser((prev) => prev ? { ...prev, requestCount: result.requestCount! } : prev);
        }
      },
      onError: (errMsg) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: streamContent || `I encountered an issue generating a response: ${errMsg}`,
                  error: !streamContent,
                }
              : m
          )
        );
      },
    });
  };

  const handleRegenerate = async (messageId: string) => {
    if (!activeChatId || !user || isStreaming) return;
    const msgIdx = messages.findIndex((m) => m.id === messageId);
    if (msgIdx === -1) return;

    // Keep history up to this message
    const truncated = messages.slice(0, msgIdx);
    setMessages(truncated);

    setIsStreaming(true);
    const newAsstId = 'asst_' + Date.now();
    let streamContent = '';

    setMessages([...truncated, { id: newAsstId, role: 'assistant', content: '', timestamp: Date.now() }]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    await api.streamChat({
      chatId: activeChatId,
      regenerateMessageId: messageId,
      tone: user.preferences?.tone,
      signal: controller.signal,
      onChunk: (chunk) => {
        streamContent += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === newAsstId ? { ...m, content: streamContent } : m))
        );
      },
      onSources: (sources) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === newAsstId ? { ...m, sources } : m))
        );
      },
      onDone: (result) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        if (result.requestCount !== undefined) {
          setUser((prev) => prev ? { ...prev, requestCount: result.requestCount! } : prev);
        }
      },
      onError: (errMsg) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === newAsstId
              ? { ...m, content: streamContent || errMsg, error: !streamContent }
              : m
          )
        );
      },
    });
  };

  const handleUpdateProfile = async (updates: { name?: string; preferences?: any }) => {
    const updated = await api.updateProfile(updates);
    setUser(updated);
    if (updates.preferences?.theme && updates.preferences.theme !== 'system') {
      handleSetTheme(updates.preferences.theme);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccount();
      setUser(null);
      setSettingsOpen(false);
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to delete account');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setSettingsOpen(false);
  };

  // Auth Loading Splash
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <VardaanLogo size="lg" />
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading Vardaan AI Workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, render Auth Screen
  if (!user) {
    return <AuthScreen onSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar
        user={user}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onRenameChat={handleRenameChat}
        onTogglePinChat={handleTogglePinChat}
        onDeleteChat={handleDeleteChat}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-14 px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              id="btn-sidebar-toggle"
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0 flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate max-w-[200px] sm:max-w-md">
                {activeChat?.title || 'Vardaan AI'}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Gemini 3.7 Flash
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-nav-new-chat"
              type="button"
              onClick={handleNewChat}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Global Error Banner (if any) */}
        {globalError && (
          <div className="p-3 bg-rose-500 text-white text-xs font-medium flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{globalError}</span>
            </div>
            <button type="button" onClick={() => setGlobalError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Chat Scroll Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {messages.length === 0 ? (
            <WelcomeScreen
              userName={user.name}
              onSelectPrompt={(prompt, isImageGen) =>
                handleSendMessage(prompt, [], { isImageGen })
              }
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id || index}
                  message={msg}
                  isStreaming={isStreaming && index === messages.length - 1 && msg.role === 'assistant'}
                  onRegenerate={msg.role === 'assistant' ? handleRegenerate : undefined}
                  userName={user.name}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Composer */}
        <div className="shrink-0 bg-gradient-to-t from-slate-50 via-slate-50 dark:from-slate-950 dark:via-slate-950 to-transparent pt-2">
          <ChatComposer
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            onStopStreaming={handleStopStreaming}
          />
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        user={user}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onSetTheme={handleSetTheme}
        onUpdateProfile={handleUpdateProfile}
        onClearCurrentChat={handleClearCurrentChat}
        onDeleteAllChats={handleDeleteAllChats}
        onDeleteAccount={handleDeleteAccount}
        onLogout={handleLogout}
        hasActiveChat={!!activeChatId}
      />
    </div>
  );
}
