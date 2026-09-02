import React, { useState, useMemo } from 'react';
import { VardaanLogo } from './VardaanLogo';
import { User, ChatSession } from '../types';
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Settings,
  LogOut,
  Moon,
  Sun,
  X,
  Sparkles,
  ChevronRight,
  MoreVertical,
  Check,
} from 'lucide-react';

interface SidebarProps {
  user: User;
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onTogglePinChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onTogglePinChat,
  onDeleteChat,
  onOpenSettings,
  onLogout,
  theme,
  onToggleTheme,
  isOpen,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [menuOpenChatId, setMenuOpenChatId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter and group chats
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [chats, searchQuery]);

  // Grouping by Date
  const groupedChats = useMemo(() => {
    const pinned: ChatSession[] = [];
    const today: ChatSession[] = [];
    const pastWeek: ChatSession[] = [];
    const older: ChatSession[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;

    filteredChats.forEach((chat) => {
      if (chat.pinned) {
        pinned.push(chat);
        return;
      }
      const chatTime = new Date(chat.updatedAt || chat.createdAt).getTime();
      if (chatTime >= todayStart) {
        today.push(chat);
      } else if (chatTime >= sevenDaysAgo) {
        pastWeek.push(chat);
      } else {
        older.push(chat);
      }
    });

    return { pinned, today, pastWeek, older };
  }, [filteredChats]);

  const startRename = (chat: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
    setMenuOpenChatId(null);
  };

  const saveRename = (chatId: string) => {
    if (editingTitle.trim()) {
      onRenameChat(chatId, editingTitle.trim());
    }
    setEditingChatId(null);
  };

  const renderChatItem = (chat: ChatSession) => {
    const isActive = chat.id === activeChatId;
    const isEditing = chat.id === editingChatId;

    return (
      <div
        key={chat.id}
        id={`chat-item-${chat.id}`}
        onClick={() => {
          onSelectChat(chat.id);
          onCloseMobile();
        }}
        className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 ${
          isActive
            ? 'bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 dark:bg-indigo-500/20 font-semibold border border-indigo-500/30'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          {chat.pinned ? (
            <Pin className="w-3.5 h-3.5 shrink-0 text-amber-500 fill-amber-500/20" />
          ) : (
            <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          )}

          {isEditing ? (
            <div
              className="flex items-center gap-1 flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                id={`rename-input-${chat.id}`}
                type="text"
                autoFocus
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveRename(chat.id);
                  if (e.key === 'Escape') setEditingChatId(null);
                }}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-0.5 rounded border border-indigo-500 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={() => saveRename(chat.id)}
                className="p-1 text-emerald-500 hover:text-emerald-400"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setEditingChatId(null)}
                className="p-1 text-slate-400 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="truncate flex-1">{chat.title || 'Untitled Conversation'}</span>
          )}
        </div>

        {/* Action icons on hover */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              id={`btn-pin-${chat.id}`}
              type="button"
              title={chat.pinned ? 'Unpin chat' : 'Pin chat'}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePinChat(chat.id);
              }}
              className="p-1 rounded hover:bg-slate-300/60 dark:hover:bg-slate-700/60 text-slate-400 hover:text-amber-500 transition-colors"
            >
              <Pin className={`w-3 h-3 ${chat.pinned ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
            <button
              id={`btn-rename-${chat.id}`}
              type="button"
              title="Rename chat"
              onClick={(e) => startRename(chat, e)}
              className="p-1 rounded hover:bg-slate-300/60 dark:hover:bg-slate-700/60 text-slate-400 hover:text-indigo-400 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              id={`btn-delete-${chat.id}`}
              type="button"
              title="Delete chat"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmId(chat.id);
              }}
              className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-80 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & New Chat Button */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <VardaanLogo size="sm" />
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            id="btn-new-chat"
            type="button"
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full py-2.5 px-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-between transition-all cursor-pointer hover:shadow-indigo-600/40"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </div>
            <kbd className="hidden sm:inline-block text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-normal">
              ⌘K
            </kbd>
          </button>

          {/* Search Input */}
          <div className="relative mt-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="sidebar-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-200/60 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700/60 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 custom-scrollbar">
          {filteredChats.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              {searchQuery ? 'No matching conversations' : 'No chats yet. Start a new one!'}
            </div>
          ) : (
            <>
              {/* Pinned Chats */}
              {groupedChats.pinned.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-amber-500/90 flex items-center gap-1.5">
                    <Pin className="w-3 h-3 fill-amber-500/20" />
                    <span>Pinned</span>
                  </div>
                  <div className="space-y-0.5">
                    {groupedChats.pinned.map(renderChatItem)}
                  </div>
                </div>
              )}

              {/* Today's Chats */}
              {groupedChats.today.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Today
                  </div>
                  <div className="space-y-0.5">
                    {groupedChats.today.map(renderChatItem)}
                  </div>
                </div>
              )}

              {/* Past 7 Days */}
              {groupedChats.pastWeek.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Previous 7 Days
                  </div>
                  <div className="space-y-0.5">
                    {groupedChats.pastWeek.map(renderChatItem)}
                  </div>
                </div>
              )}

              {/* Older */}
              {groupedChats.older.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Older
                  </div>
                  <div className="space-y-0.5">
                    {groupedChats.older.map(renderChatItem)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* User Usage Counter Widget */}
        <div className="p-3 mx-3 mb-2 rounded-xl bg-slate-200/70 dark:bg-slate-800/60 border border-slate-300/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              AI Activity
            </span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-[11px]">
              {user.requestCount || 0} / 50 requests
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (((user.requestCount || 0) % 50) / 50) * 100 || 6)}%`,
              }}
            />
          </div>
        </div>

        {/* User Profile & Footer Controls */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                id="btn-toggle-theme"
                type="button"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                onClick={onToggleTheme}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>

              <button
                id="btn-open-settings"
                type="button"
                title="Settings"
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                id="btn-logout"
                type="button"
                title="Sign out"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Delete this conversation?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              This will permanently delete this chat history and all associated messages.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-chat"
                type="button"
                onClick={() => {
                  onDeleteChat(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
