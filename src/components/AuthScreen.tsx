import React, { useState } from 'react';
import { VardaanLogo } from './VardaanLogo';
import { api } from '../services/api';
import { User } from '../types';
import {
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe2,
  FileText,
  ImageIcon,
  AlertCircle,
} from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your name');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        const res = await api.register(name, email, password);
        onSuccess(res.user);
      } else {
        const res = await api.login(email, password);
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      // Try login with demo account or auto-create if not exists
      try {
        const res = await api.login('demo@vardaan.ai', 'vardaan2026');
        onSuccess(res.user);
      } catch {
        const res = await api.register('Vardaan Explorer', 'demo@vardaan.ai', 'vardaan2026');
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start demo session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden relative">
      {/* Dynamic Background Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl" />
        {/* Fine grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
      </div>

      {/* Left Brand Showcase Section */}
      <div className="flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 z-10 border-b lg:border-b-0 lg:border-r border-slate-800/80">
        <div>
          <VardaanLogo size="lg" subtitle={true} />
        </div>

        <div className="my-10 lg:my-0 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            Next-Gen Gemini 3.7 Intelligence
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Unlock the power of <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Vardaan AI Assistant
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Your personal AI for complex problem-solving, mathematics, programming, multimodal file understanding, and fluent conversations in English, Hindi & Hinglish.
          </p>

          {/* Feature Highlights Bento */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm">
              <Globe2 className="w-5 h-5 text-indigo-400 mb-1.5" />
              <div className="font-semibold text-sm text-slate-200">Multilingual Fluency</div>
              <div className="text-xs text-slate-400">English, हिंदी & Hinglish automatically recognized</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm">
              <FileText className="w-5 h-5 text-purple-400 mb-1.5" />
              <div className="font-semibold text-sm text-slate-200">Document & File AI</div>
              <div className="text-xs text-slate-400">Analyze PDFs, CSVs, TXT, code & spreadsheets</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm">
              <ImageIcon className="w-5 h-5 text-pink-400 mb-1.5" />
              <div className="font-semibold text-sm text-slate-200">Image Studio & Vision</div>
              <div className="text-xs text-slate-400">Generate stunning images & inspect diagrams</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm">
              <Zap className="w-5 h-5 text-cyan-400 mb-1.5" />
              <div className="font-semibold text-sm text-slate-200">Real-time Speed</div>
              <div className="text-xs text-slate-400">Instant streaming with search grounding</div>
            </div>
          </div>
        </div>

        {/* Security & Isolation Footnote */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Each user account is fully isolated. Your chats & files are private to you.</span>
        </div>
      </div>

      {/* Right Auth Card Section */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          {/* Form Header Tabs */}
          <div className="flex rounded-xl bg-slate-800/80 p-1 mb-6 border border-slate-700/50">
            <button
              id="auth-tab-signin"
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                !isSignUp
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-tab-signup"
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                isSignUp
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isSignUp ? 'Create your Vardaan account' : 'Welcome back'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isSignUp
                ? 'Sign up to start chatting and generating with Vardaan AI'
                : 'Enter your credentials to access your separate chats & history'}
            </p>
          </div>

          {error && (
            <div
              id="auth-error-banner"
              className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-shake"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vardaan Sharma"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-600/50 mt-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Free Account' : 'Sign In to Vardaan AI'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <button
              id="btn-demo-login"
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Instant 1-Click Demo Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
