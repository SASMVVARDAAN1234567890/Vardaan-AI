import React, { useState } from 'react';
import { User } from '../types';
import { VardaanLogo } from './VardaanLogo';
import {
  X,
  User as UserIcon,
  Palette,
  MessageSquare,
  Sparkles,
  Shield,
  Trash2,
  LogOut,
  Moon,
  Sun,
  Laptop,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface SettingsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onSetTheme: (theme: 'light' | 'dark') => void;
  onUpdateProfile: (updates: { name?: string; preferences?: any }) => Promise<void>;
  onClearCurrentChat: () => Promise<void>;
  onDeleteAllChats: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onLogout: () => void;
  hasActiveChat: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  isOpen,
  onClose,
  theme,
  onSetTheme,
  onUpdateProfile,
  onClearCurrentChat,
  onDeleteAllChats,
  onDeleteAccount,
  onLogout,
  hasActiveChat,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'chat' | 'ai' | 'privacy' | 'account'>('profile');
  const [name, setName] = useState(user.name || '');
  const [tone, setTone] = useState(user.preferences?.tone || 'balanced');
  const [langPref, setLangPref] = useState(user.preferences?.language || 'auto');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmDeleteAcc, setConfirmDeleteAcc] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateProfile({
        name,
        preferences: {
          ...user.preferences,
          tone,
          language: langPref,
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div
        id="settings-modal-card"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <VardaanLogo size="sm" showText={false} />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Vardaan AI Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Sidebar Tabs */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Navigation Tab Bar */}
          <div className="w-full sm:w-48 bg-slate-50 dark:bg-slate-950/50 border-r border-slate-200 dark:border-slate-800 p-2 sm:p-3 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                activeTab === 'appearance'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Appearance</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat Data</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                activeTab === 'ai'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Intelligence</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                activeTab === 'privacy'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Privacy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                activeTab === 'account'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-500 hover:bg-rose-500/10'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>Account</span>
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto custom-scrollbar">
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                    User Profile
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage your display name and view usage statistics.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-3 py-2 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-300/60 dark:border-slate-700/60 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Total AI Requests
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Active count tracked for your account
                    </div>
                  </div>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {user.requestCount || 0}
                  </span>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                  {savedSuccess && (
                    <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Saved!
                    </span>
                  )}
                </div>
              </form>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Theme & Appearance
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose how Vardaan AI looks on your device.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onSetTheme('light')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Sun className="w-6 h-6 text-amber-500" />
                    <span className="text-xs">Light Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSetTheme('dark')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Moon className="w-6 h-6 text-indigo-400" />
                    <span className="text-xs">Dark Mode</span>
                  </button>
                </div>
              </div>
            )}

            {/* CHAT DATA TAB */}
            {activeTab === 'chat' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Chat Management
                  </h3>
                  <p className="text-xs text-slate-500">
                    Clear messages or remove your history permanently.
                  </p>
                </div>

                {hasActiveChat && (
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Clear Current Chat
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Removes all messages in this conversation
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onClearCurrentChat}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Clear Chat
                    </button>
                  </div>
                )}

                <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                        Delete All Chats
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Permanently erases all conversations in your account
                      </div>
                    </div>
                    {!confirmDeleteAll ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAll(true)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                      >
                        Delete All
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAll(false)}
                          className="px-2.5 py-1 rounded-md text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await onDeleteAllChats();
                            setConfirmDeleteAll(false);
                          }}
                          className="px-3 py-1 rounded-md bg-rose-700 text-white text-xs font-bold animate-pulse"
                        >
                          Confirm Erase
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* AI INTELLIGENCE TAB */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                    AI Response Style
                  </h3>
                  <p className="text-xs text-slate-500">
                    Customize how Vardaan AI formats and reasons.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Response Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="balanced">Balanced (Friendly, clear & structured)</option>
                    <option value="concise">Concise (Direct, fast & short)</option>
                    <option value="detailed">Detailed (Comprehensive, deep explanations & examples)</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 text-xs">
                  <div className="font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                    Active Model: Gemini 3.7 Flash
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    State-of-the-art fast multimodal AI with search grounding, code synthesis, mathematical reasoning, and native Hindi/Hinglish language processing.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
                >
                  Save AI Preferences
                </button>
              </div>
            )}

            {/* PRIVACY TAB */}
            {activeTab === 'privacy' && (
              <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Data & Privacy Notice
                </h3>
                <p>
                  Vardaan AI respects your confidentiality. Each user account is strictly isolated, ensuring that User A can never view User B's chats, documents, or data.
                </p>
                <p>
                  When you send queries or upload documents/images, the content is securely processed server-side via the configured Google Gemini API service to generate smart responses and analyses.
                </p>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Security Note:</span> API keys are stored securely server-side and never exposed to client browsers.
                </div>
              </div>
            )}

            {/* ACCOUNT TAB */}
            {activeTab === 'account' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Account Controls
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sign out or delete your account and all data.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Vardaan AI</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10">
                    <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
                      Delete Account
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      This action cannot be undone. All your chats, messages, and profile data will be permanently wiped.
                    </p>
                    {!confirmDeleteAcc ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAcc(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                      >
                        Delete My Account
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAcc(false)}
                          className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={onDeleteAccount}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-bold"
                        >
                          Confirm Account Deletion
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
