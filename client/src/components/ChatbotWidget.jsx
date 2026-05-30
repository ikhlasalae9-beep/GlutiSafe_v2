import { Bot, CheckCircle2, Copy, Lock, MessageCircle, Plus, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sendChatbotMessage } from '../lib/api.js';

const CHATBOT_CONTEXT_KEY = 'glutisafe_last_scan_context';
const CHATBOT_MESSAGES_KEY = 'glutisafe_chatbot_messages';
const FREE_AI_LIMIT_CODES = new Set(['FREE_AI_LIMIT_REACHED', 'AI_LIMIT_REACHED']);
const GENERIC_ERROR = "L'assistant est momentanément indisponible. Réessayez dans un instant.";

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: "Bonjour 👋 Je suis l'assistant GlutiSafe. Posez-moi une question sur les ingrédients, le gluten ou votre résultat d'analyse.",
};

const SUGGESTIONS = [
  'Ce produit est-il sûr ?',
  'Explique mon résultat',
  'Quels ingrédients surveiller ?',
  'Comment fonctionne GlutiSafe ?',
  'Voir les packs',
];

export default function ChatbotWidget() {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => loadMessages());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState(false);

  const hidden = location.pathname === '/admin' || location.pathname === '/admin-secure';
  const canSend = useMemo(() => input.trim().length > 0 && !loading && !limitReached, [input, loading, limitReached]);

  useEffect(() => {
    sessionStorage.setItem(CHATBOT_MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading, error, limitReached, open]);

  if (hidden) return null;

  async function sendMessage(value) {
    const cleanMessage = String(value || '').trim();
    if (!cleanMessage || loading || limitReached) return;

    if (cleanMessage === 'Voir les packs') {
      setOpen(false);
      navigate('/packs');
      return;
    }

    setInput('');
    setError('');
    setLoading(true);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content: cleanMessage }]);

    try {
      const data = await sendChatbotMessage({
        message: cleanMessage,
        context: getStoredScanContext() || {},
      });
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: data.reply }]);
    } catch (sendError) {
      if (FREE_AI_LIMIT_CODES.has(sendError.code) || sendError.status === 429) {
        setLimitReached(true);
        setInput('');
        setError('');
      } else {
        setError(GENERIC_ERROR);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !isMobileViewport()) {
      event.preventDefault();
      sendMessage(input);
    }
  }

  function startNewConversation() {
    setMessages([WELCOME_MESSAGE]);
    setInput('');
    setError('');
    setLimitReached(false);
  }

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[9999] sm:bottom-6 sm:right-6">
      {open ? (
        <section className="fixed inset-x-0 bottom-0 flex h-[85svh] max-h-[85svh] w-full flex-col overflow-hidden rounded-t-[1.5rem] border border-[#dfe8df] bg-[#f7f8f6] shadow-[0_-18px_70px_rgba(29,37,43,0.2)] transition sm:absolute sm:bottom-20 sm:right-0 sm:h-[620px] sm:max-h-[min(78vh,620px)] sm:w-[420px] sm:rounded-[1.5rem] sm:shadow-[0_24px_70px_rgba(29,37,43,0.18)]">
          <header className="sticky top-0 z-10 border-b border-[#dfe8df] bg-white/95 px-4 py-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#008f45] text-white shadow-[0_12px_28px_rgba(0,143,69,0.22)]">
                  <Bot className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-black text-[#1d252b]">Assistant intelligent</h2>
                  <p className="truncate text-xs font-semibold text-slate-500">Ingrédients, gluten et résultats</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#008f45]">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Disponible pour vous aider
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={startNewConversation} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dfe8df] bg-white text-slate-600 transition hover:text-[#008f45]" aria-label="Nouvelle conversation">
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dfe8df] bg-white text-slate-600 transition hover:text-[#008f45]" aria-label="Fermer le chat">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="mb-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  disabled={loading || limitReached}
                  className="rounded-full border border-[#dfe8df] bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:border-[#008f45] hover:text-[#008f45] disabled:opacity-60"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {loading ? <TypingState /> : null}
              {error ? <ErrorState message={error} /> : null}
              {limitReached ? <AiLimitUpgradeCard /> : null}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form className="border-t border-[#dfe8df] bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]" onSubmit={handleSubmit}>
            <div className="flex items-end gap-2 rounded-[1.25rem] border border-[#dfe8df] bg-[#f7f8f6] p-2 focus-within:border-[#008f45] focus-within:ring-4 focus-within:ring-[#a8cfa5]/35">
              <textarea
                className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-[#1d252b] outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
                placeholder={limitReached ? 'Limite gratuite atteinte' : 'Écrivez votre question...'}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={1200}
                disabled={loading || limitReached}
              />
              <button type="submit" disabled={!canSend} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#008f45] text-white shadow-[0_10px_24px_rgba(0,143,69,0.22)] transition hover:bg-[#00753b] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none" aria-label="Envoyer">
                <Send className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#008f45] text-white shadow-[0_18px_42px_rgba(0,143,69,0.28)] transition hover:-translate-y-1 hover:bg-[#00753b] focus:outline-none focus:ring-4 focus:ring-[#a8cfa5]/50"
        onClick={() => setOpen((value) => !value)}
        aria-label="Ouvrir l'assistant GlutiSafe"
        type="button"
      >
        <MessageCircle className="h-7 w-7" aria-hidden="true" />
      </button>
    </div>
  );
}

function ChatBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`group max-w-[86%] whitespace-pre-wrap rounded-2xl p-3 text-sm leading-6 shadow-sm ${
          isUser ? 'rounded-br-md bg-[#008f45] text-white' : 'rounded-bl-md bg-white text-slate-700 ring-1 ring-[#dfe8df]'
        }`}
      >
        <p>{message.content}</p>
        {!isUser ? (
          <button type="button" onClick={() => navigator.clipboard?.writeText(message.content)} className="mt-2 hidden items-center gap-1 text-xs font-bold text-slate-400 group-hover:inline-flex hover:text-[#008f45]">
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copier
          </button>
        ) : null}
      </div>
    </div>
  );
}

function TypingState() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[86%] rounded-2xl rounded-bl-md bg-white p-3 text-sm font-semibold leading-6 text-slate-600 shadow-sm ring-1 ring-[#dfe8df]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#008f45]" aria-hidden="true" />
          <span>L'assistant prépare une réponse...</span>
          <span className="inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#008f45]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#008f45] [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#008f45] [animation-delay:240ms]" />
          </span>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700">{message}</div>;
}

function AiLimitUpgradeCard() {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm leading-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#008f45]">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-black text-[#1d252b]">Limite gratuite atteinte</p>
          <p className="mt-1 font-semibold text-slate-600">
            Vous avez atteint la limite gratuite de 5 messages avec l'assistant intelligent. Passez à un pack premium pour continuer.
          </p>
          <Link to="/packs" className="mt-3 inline-flex items-center justify-center rounded-2xl bg-[#008f45] px-4 py-2 text-xs font-black text-white transition hover:bg-[#004b3a]">
            Voir les packs
          </Link>
        </div>
      </div>
    </div>
  );
}

function loadMessages() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(CHATBOT_MESSAGES_KEY) || 'null');
    return Array.isArray(stored) && stored.length ? stored : [WELCOME_MESSAGE];
  } catch {
    return [WELCOME_MESSAGE];
  }
}

function getStoredScanContext() {
  try {
    return JSON.parse(sessionStorage.getItem(CHATBOT_CONTEXT_KEY) || 'null');
  } catch {
    return null;
  }
}

function isMobileViewport() {
  return window.matchMedia('(max-width: 640px)').matches;
}
