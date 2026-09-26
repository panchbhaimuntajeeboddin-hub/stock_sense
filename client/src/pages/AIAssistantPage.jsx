import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Database,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Building2,
  PackageCheck
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const AIAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `Hello! I am **StockSense AI**, your intelligent inventory assistant. I answer questions grounded strictly in real PostgreSQL database records.

Here are some questions you can ask me:
• *"Which products are low in stock?"*
• *"Which products should I reorder?"*
• *"Show me today's stock movements."*
• *"Which warehouse has the most stock?"*
• *"Which products have the highest outgoing quantity?"*
• *"Which products may run out soon?"*`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const samplePrompts = [
    'Which products are low in stock?',
    'Which products should I reorder?',
    "Show me today's stock movements.",
    'Which warehouse has the most stock?',
    'Which products have the highest outgoing quantity?',
    'Which products may run out soon?'
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (userPrompt) => {
    const textToSend = (userPrompt || input).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/inventory-assistant', { message: textToSend });
      const data = res.data.data;

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString(),
        metrics: data.metrics,
        groundedInDatabase: data.groundedInDatabase
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ **Error querying AI Assistant**: ${err.response?.data?.message || 'Failed to reach backend analysis engine.'}`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedMarkdown = (text) => {
    return text.split('\n').map((line, idx) => {
      let formattedLine = line;
      // Bold formatting replacement
      const parts = formattedLine.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className="min-h-[1rem] leading-relaxed">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="text-white font-extrabold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <em key={pIdx} className="text-purple-300 italic">
                  {part.slice(1, -1)}
                </em>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in flex flex-col h-[calc(100vh-120px)]">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" /> AI Inventory Assistant
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            100% grounded in current PostgreSQL database metrics. Never halllucinates numbers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={() => setMessages([messages[0]])}
            size="sm"
          >
            Clear Chat History
          </Button>
        </div>
      </div>

      {/* CHAT CONTAINER */}
      <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl">
        {/* MESSAGES FEED */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-purple-600 shadow-purple-600/30'
                    : 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-indigo-600/30'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs space-y-1 shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1 border-b border-slate-800/60 pb-1">
                  <span className="font-bold text-[10px] text-purple-300">
                    {msg.sender === 'user' ? 'You' : 'StockSense AI Assistant'}
                  </span>
                  <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
                </div>

                <div className="space-y-1">{renderFormattedMarkdown(msg.text)}</div>

                {msg.sender === 'ai' && msg.groundedInDatabase && (
                  <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[9px] text-emerald-400 font-bold">
                    <Database className="w-3 h-3" /> Grounding Verified: Response calculated from live PostgreSQL inventory data
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-xl">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-5 h-5 animate-spin" />
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                Querying PostgreSQL database and building reasoning context...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* QUICK SUGGESTION PROMPTS */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 overflow-x-auto flex gap-2 shrink-0 scrollbar-none">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-900 hover:bg-purple-900/30 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-purple-300 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all"
            >
              💡 {p}
            </button>
          ))}
        </div>

        {/* INPUT BOX */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2 shrink-0"
        >
          <input
            type="text"
            placeholder="Ask AI about low stock, reorders, todays movements, warehouse totals..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <Button variant="primary" type="submit" isLoading={loading} icon={Send}>
            Ask AI
          </Button>
        </form>
      </div>
    </div>
  );
};
