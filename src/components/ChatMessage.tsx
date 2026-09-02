import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, GroundingSource, Attachment } from '../types';
import { VardaanLogo } from './VardaanLogo';
import { speechSpeaker } from '../utils/voice';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  Download,
  ExternalLink,
  FileText,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  AlertTriangle,
  Sparkles,
  Maximize2,
  X,
} from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: (messageId: string) => void;
  onRetry?: () => void;
  userName?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
  onRegenerate,
  onRetry,
  userName = 'You',
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeakToggle = () => {
    if (isSpeaking) {
      speechSpeaker.stop();
      setIsSpeaking(false);
    } else {
      speechSpeaker.speak(message.content, (speaking) => {
        setIsSpeaking(speaking);
      });
    }
  };

  const handleDownloadImage = (url: string, filename = 'vardaan-ai-image.png') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderAttachmentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-pink-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-rose-500" />;
    if (mimeType.includes('csv') || mimeType.includes('sheet')) return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    return <FileCode className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`py-4 sm:py-6 px-3 sm:px-6 w-full transition-colors duration-150 ${
        isUser
          ? 'bg-transparent'
          : 'bg-slate-100/50 dark:bg-slate-900/40 border-y border-slate-200/50 dark:border-slate-800/40'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-3 sm:gap-4 items-start">
        {/* Avatar */}
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-100 dark:bg-slate-700 dark:text-slate-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm mt-0.5">
            {userName ? userName[0].toUpperCase() : 'U'}
          </div>
        ) : (
          <div className="shrink-0 mt-0.5">
            <VardaanLogo size="sm" showText={false} />
          </div>
        )}

        {/* Message Body Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Role Name & Timestamp */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {isUser ? userName : 'Vardaan AI'}
              </span>
              <span className="text-[10px] text-slate-400">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Top Right Quick Actions */}
            {!isUser && !isStreaming && (
              <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={handleSpeakToggle}
                  title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                  className={`p-1 rounded-md text-xs transition-colors ${
                    isSpeaking
                      ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 animate-pulse'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy response"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {onRegenerate && (
                  <button
                    type="button"
                    onClick={() => onRegenerate(message.id)}
                    title="Regenerate response"
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Attachments (if any) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2.5 my-2">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300/70 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 max-w-xs"
                >
                  {att.mimeType.startsWith('image/') && (att.previewUrl || att.base64) ? (
                    <img
                      src={att.previewUrl || att.base64}
                      alt={att.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setPreviewImage(att.previewUrl || att.base64 || null)}
                    />
                  ) : (
                    renderAttachmentIcon(att.mimeType)
                  )}
                  <div className="truncate min-w-0">
                    <div className="truncate font-medium">{att.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {att.size ? `${(att.size / 1024).toFixed(1)} KB` : att.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Generated Image (if any) */}
          {message.isImageGen && message.imageUrl && (
            <div className="my-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900/50 max-w-lg shadow-lg">
              <div className="relative group">
                <img
                  src={message.imageUrl}
                  alt="Generated AI Art"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-96 object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                  onClick={() => setPreviewImage(message.imageUrl || null)}
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setPreviewImage(message.imageUrl || null)}
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md shadow-md text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadImage(message.imageUrl!)}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message Text / Markdown */}
          {message.error ? (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Generation Notice</p>
                <p className="mt-0.5 text-rose-700 dark:text-rose-200">{message.content}</p>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-500 transition-colors text-xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry Request</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans overflow-x-auto break-words markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeText = String(children).replace(/\n$/, '');

                    if (!inline && match) {
                      return (
                        <CodeBlock
                          language={match[1]}
                          code={codeText}
                        />
                      );
                    }
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-xs"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left text-xs border-collapse divide-y divide-slate-200 dark:divide-slate-800">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  thead({ children }) {
                    return <thead className="bg-slate-100 dark:bg-slate-800/60 font-semibold">{children}</thead>;
                  },
                  th({ children }) {
                    return <th className="px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold">{children}</th>;
                  },
                  td({ children }) {
                    return <td className="px-3 py-2 text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800">{children}</td>;
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>;
                  },
                  h1({ children }) {
                    return <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2">{children}</h1>;
                  },
                  h2({ children }) {
                    return <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1.5">{children}</h2>;
                  },
                  h3({ children }) {
                    return <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2.5 mb-1">{children}</h3>;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-4 border-indigo-500 pl-3 py-1 my-2 italic text-slate-600 dark:text-slate-400 bg-indigo-500/5 rounded-r-lg">
                        {children}
                      </blockquote>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Streaming Indicator */}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Search Grounding Citations */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Sources & Citations:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800/80 hover:bg-indigo-500/10 hover:border-indigo-500/30 border border-slate-300/60 dark:border-slate-700 text-[11px] text-indigo-600 dark:text-indigo-400 transition-colors"
                  >
                    <span className="truncate max-w-[200px]">{src.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

// Sub-component for code blocks with copy action
interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 text-xs font-mono shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/90 border-b border-slate-700/60 text-[11px]">
        <span className="text-slate-400 font-semibold uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto leading-relaxed selection:bg-indigo-500/30">
        <code>{code}</code>
      </pre>
    </div>
  );
};
