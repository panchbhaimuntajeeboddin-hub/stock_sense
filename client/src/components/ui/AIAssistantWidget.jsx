import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { Sparkles, X, Send, Bot, User, Database, ArrowRight } from 'lucide-react';

export const AIAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'w-welcome',
      sender: 'ai',
      text: 'Hi! I am StockSense AI. Ask me about low stock, today\'s movements, or warehouse stock.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const widgetEndRef = useRef(null);

  const samplePrompts = [
    'Which products are low in stock?',
    'Which products should I reorder?',
    "Show me today's stock movements.",
    'Which warehouse has the most stock?'
  ];

  useEffect(() => {
    if (isOpen) {
      widgetEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (customPrompt) => {
    const text = (customPrompt || input).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `w-usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/inventory-assistant', { message: text });
      const data = res.data.data;

      const aiMsg = {
        id: `w-ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errMsg = {
        id: `w-err-${Date.now()}`,
        sender: 'ai',
        text: 'Error querying AI assistant.',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-full shadow-2xl shadow-purple-600/40 transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
          <span>Ask AI Assistant</span>
        </button>
      )}

      {isOpen && (
        <div className="w-88 sm:w-96 h-[500px] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* HEADER */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-white">StockSense AI Assistant</h4>
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                  <Database className="w-2.5 h-2.5" /> Live DB Grounding
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 max-w-[85%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-[10px] ${
                    m.sender === 'user' ? 'bg-purple-600' : 'bg-indigo-600'
                  }`}
                >
                  {m.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                </div>
                <div
                  className={`p-3 rounded-2xl text-[11px] leading-relaxed shadow ${
                    m.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                Querying PostgreSQL database...
              </div>
            )}
            <div ref={widgetEndRef} />
          </div>

          {/* QUICK PROMPTS */}
          <div className="p-2 bg-slate-900/60 border-t border-slate-800/80 overflow-x-auto flex gap-1.5 shrink-0 scrollbar-none">
            {samplePrompts.slice(0, 3).map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                disabled={loading}
                className="px-2.5 py-1 bg-slate-950 hover:bg-purple-900/30 border border-slate-800 text-slate-300 rounded-lg text-[10px] whitespace-nowrap transition-all"
              >
                💡 {p}
              </button>
            ))}
          </div>

          {/* INPUT FORM */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
