export default function Footer({ onNavigate }) {
  return (
    <footer className="section-band mt-16">
      <div className="page-shell grid gap-8 py-10 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="GlutiSafe" className="h-10 w-10 rounded-xl object-contain" />
            <p className="text-lg font-black text-slate-950">GlutiSafe</p>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
            GlutiSafe ne garantit pas qu’un produit est 100% sans gluten. L’application aide à analyser les ingrédients
            visibles. Vérifiez toujours les mentions officielles du fabricant.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-3 md:justify-end">
          {[
            ['home', 'Home'],
            ['analyse', 'Analyse'],
            ['historique', 'Historique'],
            ['a-propos', 'À propos'],
          ].map(([page, label]) => (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(page)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
