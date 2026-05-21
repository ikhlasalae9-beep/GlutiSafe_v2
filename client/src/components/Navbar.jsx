import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const links = [
  ['home', 'Home'],
  ['analyse', 'Analyse'],
  ['historique', 'Historique'],
  ['a-propos', 'À propos'],
];

export default function Navbar({ activePage, onNavigate }) {
  const [open, setOpen] = useState(false);

  function go(page) {
    onNavigate(page);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100/80 bg-white/80 backdrop-blur-xl">
      <nav className="page-shell flex min-h-[76px] items-center justify-between gap-4">
        <button type="button" onClick={() => go('home')} className="flex items-center gap-3 text-left">
          <img src="/logo.png" alt="GlutiSafe" className="h-12 w-12 rounded-2xl object-contain shadow-sm" />
          <div>
            <p className="text-lg font-black text-slate-950">GlutiSafe</p>
            <p className="text-xs font-semibold text-emerald-700">Analyse gluten prudente</p>
          </div>
        </button>

        <div className="hidden items-center gap-2 md:flex">
          {links.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                activePage === id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="hidden md:block">
          <button type="button" onClick={() => go('analyse')} className="primary-btn rounded-full px-5 py-3 text-sm font-black">
            Analyser un produit
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 md:hidden"
          aria-label="Ouvrir le menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <div className="page-shell grid gap-2 py-4">
            {links.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => go(id)}
                className="rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-emerald-50"
              >
                {label}
              </button>
            ))}
            <button type="button" onClick={() => go('analyse')} className="primary-btn rounded-2xl px-4 py-3 text-sm font-black">
              Analyser un produit
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
