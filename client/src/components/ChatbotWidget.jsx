import { Bot, Lock, MessageCircle, RotateCcw, Send, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { sendChatbotMessage } from '../lib/api.js';
import Button from './Button.jsx';

const CHATBOT_CONTEXT_KEY = 'glutisafe_last_scan_context';
const FREE_AI_LIMIT_CODES = new Set(['FREE_AI_LIMIT_REACHED', 'AI_LIMIT_REACHED']);

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: 'Bonjour. Je suis l’assistant GlutiSafe. Posez-moi une question sur les ingrédients, le gluten ou votre résultat de scan.',
};

const GENERIC_ERROR = 'Le service d’assistance est momentanément indisponible. Réessayez dans un instant.';

export default function ChatbotWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const lastUserMessage = useRef('');

  const hidden = location.pathname === '/admin' || location.pathname === '/admin-secure';
  const canSend = useMemo(() => input.trim().length > 0 && !loading && !limitReached, [input, loading, limitReached]);

  if (hidden) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const sendMessage = async (value) => {
    const cleanMessage = String(value || '').trim();
    if (!cleanMessage || loading || limitReached) return;

    lastUserMessage.current = cleanMessage;
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
        setError(sendError.message || GENERIC_ERROR);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastUserMessage.current) {
      sendMessage(lastUserMessage.current);
    }
  };

  return (
    <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 z-[9999] sm:bottom-6 sm:right-6">
      {open ? (
        <section className="mb-3 flex max-h-[min(70vh,620px)] w-[calc(100vw-32px)] max-w-[420px] flex-col overflow-hidden rounded-[1.5rem] border border-[#dfe8df] bg-white/95 shadow-[0_24px_70px_rgba(29,37,43,0.18)] backdrop-blur max-sm:max-h-[calc(100vh-120px)]">
          <header className="flex items-center justify-between gap-3 border-b border-[#dfe8df] bg-[#f7f8f6]/85 px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#008f45] text-white shadow-[0_12px_28px_rgba(0,143,69,0.22)]">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-black text-[#1d252b]">Assistant GlutiSafe</h2>
                <p className="truncate text-xs font-semibold text-slate-500">Ingrédients, gluten et résultats</p>
              </div>
            </div>
            <button
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#dfe8df] bg-white text-slate-600 transition hover:text-[#008f45] focus:outline-none focus:ring-4 focus:ring-[#a8cfa5]/35"
              onClick={() => setOpen(false)}
              aria-label="Fermer le chat"
              type="button"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f8f6] p-4">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {loading ? (
              <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white p-3 text-sm font-semibold leading-6 text-slate-600 shadow-sm ring-1 ring-[#dfe8df]">
                Analyse en cours...
              </div>
            ) : null}
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-red-700 shadow-sm ring-1 ring-red-200 transition hover:bg-red-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Réessayer
                </button>
              </div>
            ) : null}
            {limitReached ? <AiLimitUpgradeCard /> : null}
          </div>

          <form className="flex gap-2 border-t border-[#dfe8df] bg-white p-3" onSubmit={handleSubmit}>
            <input
              className="min-w-0 flex-1 rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] px-3 py-2 text-sm text-[#1d252b] outline-none transition placeholder:text-slate-400 focus:border-[#008f45] focus:bg-white focus:ring-4 focus:ring-[#a8cfa5]/35 disabled:cursor-not-allowed disabled:text-slate-400"
              placeholder={limitReached ? 'Limite gratuite atteinte' : 'Écrivez votre question...'}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={1600}
              disabled={loading || limitReached}
            />
            <Button type="submit" className="h-11 w-11 px-0" aria-label="Envoyer" icon={Send} disabled={!canSend} />
          </form>
        </section>
      ) : null}

      <button
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#008f45] text-white shadow-[0_18px_42px_rgba(0,143,69,0.28)] transition hover:-translate-y-1 hover:bg-[#00753b] focus:outline-none focus:ring-4 focus:ring-[#a8cfa5]/50"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open GlutiSafe assistant"
        type="button"
      >
        <MessageCircle className="h-7 w-7" aria-hidden="true" />
      </button>
    </div>
  );
}

function AiLimitUpgradeCard() {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm leading-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#008f45]">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-black text-[#1d252b]">Limite IA atteinte</p>
          <p className="mt-1 font-semibold text-slate-600">
            Votre Pack Gratuit inclut 5 messages avec l’assistant IA. Pour continuer, passez au Pack Mensuel ou Annuel.
          </p>
          <Link to="/packs" className="mt-3 inline-flex items-center justify-center rounded-2xl bg-[#008f45] px-4 py-2 text-xs font-black text-white transition hover:bg-[#004b3a]">
            Voir les packs
          </Link>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`whitespace-pre-wrap rounded-2xl p-3 text-sm leading-6 shadow-sm ${
        isUser ? 'ml-auto max-w-[84%] rounded-tr-sm bg-[#008f45] text-white' : 'max-w-[88%] rounded-tl-sm bg-white text-slate-700 ring-1 ring-[#dfe8df]'
      }`}
    >
      {message.content}
    </div>
  );
}

function getStoredScanContext() {
  try {
    return JSON.parse(sessionStorage.getItem(CHATBOT_CONTEXT_KEY) || 'null');
  } catch {
    return null;
  }
}
