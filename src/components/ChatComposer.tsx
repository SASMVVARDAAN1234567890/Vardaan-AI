import React, { useState, useRef, useEffect } from 'react';
import { Attachment } from '../types';
import { speechRecognizer } from '../utils/voice';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Image as ImageIcon,
  Globe2,
  Square,
  X,
  FileText,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  Smile,
} from 'lucide-react';

interface ChatComposerProps {
  onSendMessage: (text: string, attachments: Attachment[], options?: { useSearch?: boolean; isImageGen?: boolean }) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  disabled?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [useSearch, setUseSearch] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en-IN' | 'hi-IN' | 'en-US'>('en-IN');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!text.trim() && attachments.length === 0) || isStreaming || disabled) return;

    onSendMessage(text.trim(), attachments, {
      useSearch,
      isImageGen: imageMode,
    });

    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 25 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 25MB limit.`);
        continue;
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;

      newAttachments.push({
        id: 'att_' + Date.now() + '_' + i,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        base64: base64Data,
        previewUrl: file.type.startsWith('image/') ? base64Data : undefined,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Voice Speech Recognition Toggle
  const toggleVoice = () => {
    if (isListening) {
      speechRecognizer.stop();
      setIsListening(false);
    } else {
      speechRecognizer.start({
        lang: voiceLang,
        onResult: (transcript, isFinal) => {
          setText((prev) => (isFinal ? `${prev} ${transcript}`.trim() : prev + ' ' + transcript));
        },
        onError: (err) => {
          alert(err);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
      setIsListening(true);
    }
  };

  const commonEmojis = ['👍', '💡', '🔥', '❤️', '🚀', '✨', '🇮🇳', '🤖', '📊', '🎓', '💻'];

  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pb-3 sm:pb-5">
      {/* Attachments Preview Bar */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl border border-slate-300/60 dark:border-slate-700/60">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 shadow-sm"
            >
              {att.mimeType.startsWith('image/') ? (
                <img src={att.previewUrl} alt="" className="w-5 h-5 rounded object-cover" />
              ) : att.mimeType.includes('pdf') ? (
                <FileText className="w-4 h-4 text-rose-500" />
              ) : att.mimeType.includes('csv') ? (
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              ) : (
                <FileCode className="w-4 h-4 text-indigo-500" />
              )}
              <span className="truncate max-w-[120px] font-medium">{att.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="p-0.5 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 shadow-lg transition-all focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20">
        {/* Top Mode Toggles */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Image Mode Toggle */}
            <button
              id="btn-toggle-image-mode"
              type="button"
              onClick={() => setImageMode(!imageMode)}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                imageMode
                  ? 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Generate Image</span>
            </button>

            {/* Real-time Web Search Toggle */}
            <button
              id="btn-toggle-web-search"
              type="button"
              onClick={() => setUseSearch(!useSearch)}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                useSearch
                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Search Grounding</span>
            </button>

            {/* Voice Language Selector */}
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value as any)}
              className="bg-transparent text-[11px] text-slate-500 dark:text-slate-400 px-1.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="en-IN">EN (India)</option>
              <option value="hi-IN">हिंदी (Hindi)</option>
              <option value="en-US">EN (US)</option>
            </select>
          </div>

          {/* Prompt Mode Indicator */}
          {imageMode && (
            <span className="text-[11px] font-semibold text-pink-500 dark:text-pink-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Image Prompt Active
            </span>
          )}
        </div>

        {/* Input Textarea Area */}
        <div className="flex items-end gap-2 p-3">
          <textarea
            id="chat-composer-textarea"
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isStreaming}
            placeholder={
              imageMode
                ? 'Describe the image you want to create (e.g. A futuristic railway station at night)...'
                : 'Message Vardaan AI (Ask in English, Hindi or Hinglish)...'
            }
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none max-h-48 leading-relaxed font-sans"
          />

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,.pdf,.txt,.csv,.json,.md,.docx,.xlsx"
            className="hidden"
          />

          {/* Action Icons */}
          <div className="flex items-center gap-1 shrink-0 pb-0.5">
            {/* Attachment Button */}
            <button
              id="btn-composer-attachment"
              type="button"
              title="Attach files or images"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isStreaming}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Emoji Trigger */}
            <div className="relative">
              <button
                type="button"
                title="Add emoji"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Smile className="w-4 h-4" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-12 right-0 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl flex gap-1 z-20">
                  {commonEmojis.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => addEmoji(em)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-base cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Voice Input Microphone */}
            <button
              id="btn-composer-mic"
              type="button"
              title={isListening ? 'Stop recording voice' : 'Start voice input (Speech to Text)'}
              onClick={toggleVoice}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send or Stop Button */}
            {isStreaming ? (
              <button
                id="btn-composer-stop"
                type="button"
                title="Stop generation"
                onClick={onStopStreaming}
                className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                id="btn-composer-send"
                type="button"
                title="Send message"
                onClick={handleSubmit}
                disabled={(!text.trim() && attachments.length === 0) || disabled}
                className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-md shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 mt-1.5">
        <span>Press <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">Enter</kbd> to send, <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">Shift + Enter</kbd> for new line</span>
        <span className="hidden sm:inline">Powered by Gemini 3.7 Intelligence</span>
      </div>
    </div>
  );
};
