import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { MessageSquare, Send, X, Sparkles, User, Bot } from 'lucide-react';

function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'aria',
      content: "Hi, I'm **Aria**! 🎯 Your AI productivity companion. How can I help you manage your tasks, prioritize your day, or stay focused today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const chatWindowRef = useRef(null);

  // Auto-scroll to the bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Click outside notification panel handling (optional)
  useEffect(() => {
    function handleClickOutside(event) {
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target) && !event.target.closest('.ai-chat-launcher')) {
        // Keep open or close? Let's just keep it open, closing on click outside might be annoying while copying text.
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async (textToSend) => {
    const messageText = textToSend || input.trim();
    if (!messageText) return;

    if (!textToSend) {
      setInput('');
    }

    // Add user message to state
    const userMessage = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // API call to post chat message
      const res = await api.post('/ai/chat', {
        message: messageText,
        history: messages.map((m) => ({
          role: m.role === 'aria' ? 'model' : 'user',
          content: m.content,
        })),
      });

      const reply = res.data.reply;
      setMessages((prev) => [...prev, { role: 'aria', content: reply }]);
    } catch (err) {
      console.error('Error fetching chat response:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'aria',
          content: "Sorry, I ran into a connection issue. Can you try sending that again?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestionText) => {
    handleSend(suggestionText);
  };

  // Helper to parse simple markdown bold strings to JSX
  const formatMessageContent = (text) => {
    if (!text) return '';
    // Format bold (**text** or __text__)
    const parts = text.split(/(\*\*.*?\*\*|\n)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-indigo-900 dark:text-indigo-200">{part.slice(2, -2)}</strong>;
      }
      if (part === '\n') {
        return <br key={index} />;
      }
      return part;
    });
  };

  const suggestions = [
    { text: 'Plan my day', icon: '📋', label: 'Plan my day' },
    { text: 'What is urgent?', icon: '⚠️', label: 'Urgent Tasks' },
    { text: 'Productivity tips', icon: '💡', label: 'Get Advice' },
    { text: 'Summarize progress', icon: '📊', label: 'Workload Status' },
  ];

  return (
    <>
      {/* Floating Action Button Launcher */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ai-chat-launcher fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-xl hover:scale-105 active:scale-95 hover:shadow-indigo-500/25 transition-all duration-200 cursor-pointer border border-white/10"
        title="Chat with Aria AI Productivity Coach"
      >
        {isOpen ? (
          <X className="h-6 w-6 animate-spin-once" />
        ) : (
          <div className="relative">
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
          </div>
        )}
      </button>

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div
          ref={chatWindowRef}
          className="fixed bottom-24 right-6 z-50 flex h-[540px] w-85 sm:w-[400px] flex-col rounded-3xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl dark:border-slate-800 dark:bg-slate-900/95 transition-all duration-300 ease-out animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20 rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-bold text-sm text-slate-950 dark:text-white leading-none">
                    Aria
                  </h3>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[10px] text-slate-450 mt-1">AI Productivity Coach</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat History Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
                    msg.role === 'user'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350'
                  }`}
                >
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Message Box */}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-100 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-150 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{formatMessageContent(msg.content)}</p>
                </div>
              </div>
            ))}

            {/* Simulated Typing Indicator */}
            {loading && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex gap-1 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 dark:border-slate-800 dark:bg-slate-850">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-550 [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-550 [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-550"></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompt Chips */}
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-900/20">
            {suggestions.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(chip.text)}
                disabled={loading}
                className="flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 py-1 px-2.5 text-[10px] sm:text-[11px] font-medium text-slate-650 shadow-2xs transition-all duration-150 cursor-pointer disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 dark:hover:bg-slate-900"
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Form input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-3xl"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask Aria anything about your day..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-750 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default AIChatBot;
