'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchResult } from '@/types/search';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

interface AiAnswerPanelProps {
  aiAnswer: string;
  intent: string;
  rewrittenQuery: string;
  sources: SearchResult[];
  processingTimeMs: number;
  userCity?: string;
  onSourceClick?: (source: SearchResult) => void;
  onClose?: () => void;
}

interface ContextDoc {
  title?: string; name?: string;
  category?: string; city?: string;
  phone?: string; website?: string;
  rating?: number; street?: string;
  source?: string;
}

// ── Markdown léger ────────────────────────────────────────────────
function parseBold(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1 ? <strong key={i} className="font-medium text-gray-900 dark:text-gray-100">{p}</strong> : p
  );
}

function Prose({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let ulBuffer: string[] = [];

  const flushUl = (key: string) => {
    if (!ulBuffer.length) return;
    nodes.push(
      <ul key={key} className="space-y-1 my-2 ml-1">
        {ulBuffer.map((item, j) => (
          <li key={j} className="flex gap-2 text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span>{parseBold(item)}</span>
          </li>
        ))}
      </ul>
    );
    ulBuffer = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) { flushUl(`ul${i}`); nodes.push(<div key={i} className="h-1" />); return; }

    if (line.startsWith('- ') || line.startsWith('• ')) {
      ulBuffer.push(line.slice(2));
      return;
    }
    const numbered = line.match(/^(\d+)\.\s+(.*)/);
    if (numbered) {
      flushUl(`ul${i}`);
      nodes.push(
        <div key={i} className="flex gap-2.5 items-baseline text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed mb-1">
          <span className="font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">{numbered[1]}.</span>
          <span>{parseBold(numbered[2])}</span>
        </div>
      );
      return;
    }
    flushUl(`ul${i}`);
    nodes.push(
      <p key={i} className="text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed mb-2">{parseBold(line)}</p>
    );
  });
  flushUl('ul-final');
  return <>{nodes}</>;
}

// ── Favicon helper ────────────────────────────────────────────────
function SourceFavicon({ website, title }: { website?: string; title?: string }) {
  const [err, setErr] = useState(false);
  if (website && !err) {
    try {
      const host = new URL(website.startsWith('http') ? website : 'https://' + website).hostname;
      return (
        <img
          src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`}
          onError={() => setErr(true)}
          alt=""
          className="w-4 h-4 rounded-sm object-contain flex-shrink-0"
        />
      );
    } catch {}
  }
  const letter = (title?.[0] ?? '?').toUpperCase();
  return (
    <span className="w-4 h-4 rounded-sm bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
      {letter}
    </span>
  );
}

// ── Sparkle icon (Google AI style) ───────────────────────────────
function SparkleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.5 9.5L21 12L13.5 14.5L12 22L10.5 14.5L3 12L10.5 9.5L12 2Z"
        fill="url(#ai-grad)" />
      <defs>
        <linearGradient id="ai-grad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4285F4" />
          <stop offset="0.5" stopColor="#9B5DE5" />
          <stop offset="1" stopColor="#F15BB5" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────
export function AiAnswerPanel({
  aiAnswer: _backendAnswer,
  intent: _intent,
  rewrittenQuery,
  sources,
  processingTimeMs: _ms,
  userCity,
  onSourceClick,
  onClose,
}: AiAnswerPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [groqAvailable, setGroqAvailable] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialized) return;
    setInitialized(true);
    generateResponse([], true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (expanded) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, expanded]);

  const generateResponse = useCallback(async (history: ChatMessage[], isInitial = false) => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: rewrittenQuery,
          context: sources as unknown as ContextDoc[],
          history: isInitial ? [] : history,
          userCity,
        }),
      });

      if (!res.ok) {
        if (res.status === 503) {
          setGroqAvailable(false);
          const fallback = _backendAnswer || 'Configurez GROQ_API_KEY dans .env.local pour activer la synthèse IA.';
          setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: fallback }]);
          return;
        }
        throw new Error('Erreur serveur');
      }

      setGroqAvailable(true);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: full, streaming: true }]);
      }
      setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: full }]);
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: 'Une erreur est survenue.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [rewrittenQuery, sources, _backendAnswer, userCity]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setExpanded(true);
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    await generateResponse(next);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const firstMessage = messages[0];
  const chatMessages = messages.slice(1); // follow-ups après la première réponse
  const hasFollowUps = chatMessages.length > 0;

  return (
    <div className="mb-6 rounded-2xl border border-[#dde3ea] dark:border-gray-700 bg-white dark:bg-[#1e1e2e] overflow-hidden shadow-sm">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          {/* Mini logo YowYob : cercle bleu + "b" blanc + roues dorées + anse noire */}
          <svg width="22" height="22" viewBox="0 0 100 105" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Anse noire */}
            <path d="M28 8 Q28 2 36 2 Q44 2 44 10 L44 28" stroke="#1a1a1a" strokeWidth="11" strokeLinecap="round" fill="none"/>
            {/* Cercle bleu principal */}
            <circle cx="55" cy="55" r="42" fill="#3A6DB5"/>
            {/* "b" blanc découpé : corps vertical + ventre circulaire */}
            <rect x="38" y="20" width="12" height="58" rx="6" fill="white"/>
            <circle cx="58" cy="63" r="18" fill="white"/>
            <circle cx="58" cy="63" r="10" fill="#3A6DB5"/>
            {/* Roues dorées */}
            <circle cx="38" cy="94" r="7" fill="#D4A017"/>
            <circle cx="70" cy="94" r="7" fill="#D4A017"/>
          </svg>
          <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200 tracking-tight">
            Aperçu IA
          </span>
          {userCity && (
            <span className="text-[12px] text-gray-400 dark:text-gray-500">· {userCity}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {groqAvailable === false && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/30">
              GROQ_API_KEY manquante
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg leading-none"
              aria-label="Fermer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Réponse initiale ── */}
      <div className="px-5 pb-1">
        {!firstMessage || firstMessage.streaming ? (
          <div className="flex gap-1.5 items-center py-2">
            {[0, 150, 300].map(d => (
              <span key={d} className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-bounce"
                style={{ animationDelay: `${d}ms` }} />
            ))}
            <span className="text-[13px] text-gray-400 ml-1">L&apos;IA analyse les résultats…</span>
          </div>
        ) : (
          <div className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
            <Prose text={firstMessage?.content ?? ''} />
            {firstMessage?.streaming && (
              <span className="inline-block w-[3px] h-[15px] bg-blue-500 ml-0.5 animate-pulse rounded-sm align-middle" />
            )}
          </div>
        )}
      </div>

      {/* ── Sources ── */}
      {sources.length > 0 && (
        <div className="px-5 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {sources.slice(0, 8).map(src => (
              <button
                key={src.id}
                onClick={() => onSourceClick?.(src)}
                className="flex-shrink-0 flex items-center gap-1.5 bg-[#f0f4f9] dark:bg-gray-800 hover:bg-[#e3eaf4] dark:hover:bg-gray-700 rounded-full px-3 py-1.5 transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-900/40 group"
              >
                <SourceFavicon website={src.website} title={src.title || src.name} />
                <span className="text-[12px] text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate max-w-[130px] transition-colors">
                  {src.title || src.name}
                </span>
              </button>
            ))}
            {sources.length > 8 && (
              <span className="flex-shrink-0 flex items-center text-[12px] text-gray-400 px-2">
                +{sources.length - 8}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Thread de suivi (affiché si questions posées) ── */}
      {hasFollowUps && (
        <div className="border-t border-[#dde3ea] dark:border-gray-700 mx-4 mb-3" />
      )}
      {hasFollowUps && (
        <div className="px-5 space-y-4 pb-3 max-h-[360px] overflow-y-auto">
          {chatMessages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'user' ? (
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-[10px] font-bold">U</span>
                  </div>
                  <p className="text-[15px] font-medium text-gray-800 dark:text-gray-200 pt-0.5">{msg.content}</p>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 pl-1">
                  <SparkleIcon size={16} />
                  <div className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-300 flex-1">
                    <Prose text={msg.content || '…'} />
                    {msg.streaming && (
                      <span className="inline-block w-[3px] h-[14px] bg-blue-500 ml-0.5 animate-pulse rounded-sm align-middle" />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ── Barre de question de suivi (style Google) ── */}
      <div className="px-4 pb-4 pt-1">
        <div className="flex items-center gap-3 rounded-full border border-[#dde3ea] dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 hover:border-blue-300 dark:hover:border-blue-700 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:shadow-[0_0_0_2px_rgba(66,133,244,0.12)] transition-all">
          <SparkleIcon size={16} />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Poser une question de suivi"
            disabled={loading || groqAvailable === false}
            className="flex-1 text-[14px] text-gray-700 dark:text-gray-300 bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-40"
          />
          {input.trim() && (
            <button
              onClick={handleSend}
              disabled={loading}
              className="flex-shrink-0 text-blue-600 hover:text-blue-700 disabled:opacity-40 transition-colors"
              aria-label="Envoyer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
