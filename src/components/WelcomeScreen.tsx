import React from 'react';
import { VardaanLogo } from './VardaanLogo';
import {
  Sparkles,
  BookOpen,
  Code2,
  FileSpreadsheet,
  Image as ImageIcon,
  Lightbulb,
  Languages,
  ArrowUpRight,
} from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string, isImageGen?: boolean) => void;
  userName?: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectPrompt,
  userName,
}) => {
  const suggestions = [
    {
      icon: BookOpen,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      title: 'Help Me Study',
      description: 'Create a revision sheet on Newton’s Laws of Motion with formulas & step-by-step examples',
      prompt: 'Please create a comprehensive study guide and revision summary for Newton\'s Laws of Motion with key formulas, real-world examples, and practice questions.',
    },
    {
      icon: Code2,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      title: 'Write & Debug Code',
      description: 'Generate a full-stack React TypeScript component with Tailwind styling',
      prompt: 'Write a clean, production-ready TypeScript React component with modern Tailwind CSS styling, responsive layout, and interactive state.',
    },
    {
      icon: ImageIcon,
      color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
      title: 'Create an AI Image',
      description: 'Generate a futuristic railway station in cybernetic neon rain',
      prompt: 'Create a futuristic railway station at night with neon lights and high-speed maglev train in cybernetic style.',
      isImageGen: true,
    },
    {
      icon: Languages,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      title: 'Hindi & Hinglish Support',
      description: 'मुझे क्वांटम कंप्यूटिंग आसान हिंदी या Hinglish में समझाओ',
      prompt: 'Mujhe Quantum Computing ke fundamentals bilkul aasan Hinglish aur Hindi me samjhao with daily life analogies.',
    },
    {
      icon: FileSpreadsheet,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      title: 'Analyze Files & Data',
      description: 'Extract actionable insights, summaries, and calculations from data',
      prompt: 'What types of documents, CSVs, and images can you analyze? Please explain how you inspect uploaded files and datasets.',
    },
    {
      icon: Lightbulb,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      title: 'Brainstorm Ideas',
      description: '10 innovative startup concepts combining AI and green technology',
      prompt: 'Brainstorm 10 unique, high-potential startup concepts combining Artificial Intelligence with sustainability and renewable energy.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full text-center">
      {/* Brand Icon & Welcome Greeting */}
      <div className="mb-4">
        <VardaanLogo size="xl" showText={false} />
      </div>

      <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Welcome to <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Vardaan AI</span>
      </h1>

      <p className="mt-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium max-w-md">
        {userName ? `Hello, ${userName}! ` : ''}How can I help you today?
      </p>

      {/* Multilingual & Capabilities Badge */}
      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span>English, हिंदी & Hinglish • Reasoning • STEM • Coding • Multimodal Vision</span>
      </div>

      {/* Suggestion Cards Grid */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full text-left">
        {suggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              id={`suggestion-card-${idx}`}
              onClick={() => onSelectPrompt(item.prompt, item.isImageGen)}
              className="group p-4 rounded-2xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl border ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                <span>Click to use prompt</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
