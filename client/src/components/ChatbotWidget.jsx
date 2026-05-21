import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { useState } from 'react';
import Button from './Button.jsx';

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <section className="mb-4 w-[calc(100vw-40px)] max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
          <header className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-teal-800 px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-black">GlutiSafe Medical AI</h2>
                <p className="text-xs text-cyan-100">Multilingual guidance</p>
              </div>
            </div>
            <button className="rounded-xl p-2 transition hover:bg-white/10" onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>

          <div className="max-h-96 space-y-3 overflow-y-auto bg-slate-50 p-4">
            <div className="rounded-xl rounded-tl-sm bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm ring-1 ring-slate-200">
              Bonjour! Hello! Hola! 你好! !مرحبا I am your GlutiSafe assistant. Ask me anything about gluten
              sensitivity, symptoms, or diets.
            </div>
            <div className="ml-auto max-w-[82%] rounded-xl rounded-tr-sm bg-cyan-600 p-3 text-sm leading-6 text-white shadow-sm">
              Quels sont les symptômes de la maladie cœliaque?
            </div>
            <div className="max-w-[88%] rounded-xl rounded-tl-sm bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm ring-1 ring-slate-200">
              Common signs can include bloating, abdominal pain, diarrhea, fatigue, anemia, weight changes, and skin
              irritation. Some people have mild or no digestive symptoms. If you suspect celiac disease, speak with a
              qualified clinician before removing gluten, because testing is most accurate while gluten is still in the
              diet.
            </div>
            <div className="ml-auto max-w-[82%] rounded-xl rounded-tr-sm bg-cyan-600 p-3 text-sm leading-6 text-white shadow-sm">
              Wach l&apos;gluten kaydir l&apos;nfakh?
            </div>
            <div className="max-w-[88%] rounded-xl rounded-tl-sm bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm ring-1 ring-slate-200">
              إييه، عند بعض الناس gluten يقدر يسبب nfakh, stomach pain, أو fatigue, خصوصا ila kayn celiac disease أو
              sensitivity. الأحسن تسول طبيب إذا الأعراض كتعاود بزاف.
            </div>
          </div>

          <form className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              placeholder="Ask a gluten question..."
            />
            <Button type="button" className="h-10 w-10 px-0" aria-label="Send" icon={Send} />
          </form>
        </section>
      ) : null}

      <button
        className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-2xl shadow-cyan-500/30 transition hover:-translate-y-1"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open GlutiSafe assistant"
      >
        <MessageCircle className="h-7 w-7" aria-hidden="true" />
      </button>
    </div>
  );
}
