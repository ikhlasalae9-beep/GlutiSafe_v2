import { ArrowRight, FileText, ScanLine, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import scannerIllustration from '../assets/glutisafe-scanner-illustration.svg';
import { getStoredUser } from '../lib/auth.js';
import { getHistory, isAlertHistoryItem, isSafeHistoryItem } from '../lib/history.js';
import { getStatusStyle } from '../lib/status.js';

export default function HomePage() {
  const currentUser = getStoredUser();
  const displayName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Utilisateur';
  const history = getHistory(currentUser);
  const recentScans = history.slice(0, 4);

  return (
    <div className="page-shell page-section">
      <section className="organic-panel surface-card grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.03fr_0.97fr] lg:p-10">
        <div className="relative z-10 flex flex-col justify-center">
          <p className="brand-kicker">Bonjour, {displayName}</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-[#1d252b] sm:text-5xl">
            Scannez vos étiquettes. Choisissez sans gluten en confiance.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            GlutiSafe lit les étiquettes, extrait les ingrédients visibles par OCR et applique un moteur de règles
            prudent pour signaler les termes liés au gluten.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/analyse" className="primary-btn">
              <ScanLine className="h-4 w-4" aria-hidden="true" />
              Analyser un produit
            </Link>
            <Link to="/history" className="secondary-btn">
              Voir l'historique
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-center">
          <img src={scannerIllustration} alt="Illustration GlutiSafe d'un produit scanné" className="w-full max-w-[560px] drop-shadow-[0_24px_45px_rgba(0,75,58,0.12)]" />
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <TrustCard icon={ScanLine} title="OCR intelligent" copy="Extraction du texte depuis une photo nette de l'étiquette." />
        <TrustCard icon={ShieldCheck} title="Vérification prudente" copy="La décision vient du moteur local, pas d'un modèle génératif." />
        <TrustCard icon={Sparkles} title="Résultat clair" copy="Verdict, mots détectés et explication lisible en quelques secondes." />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="surface-card p-6">
          <p className="brand-kicker">Vue rapide</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[#1d252b]">Activité locale</h2>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="Analyses" value={history.length} />
            <Stat label="OK" value={history.filter(isSafeHistoryItem).length} />
            <Stat label="Alertes" value={history.filter(isAlertHistoryItem).length} />
          </div>
          <div className="mt-6 rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
            <FileText className="h-6 w-6 text-[#008f45]" aria-hidden="true" />
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Conseil : photographiez toute la liste d'ingrédients, pas seulement la face avant du produit.
            </p>
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-[#dfe8df] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="brand-kicker">Analyses récentes</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#1d252b]">Derniers résultats</h2>
            </div>
            <Link to="/history" className="text-sm font-bold text-[#008f45] hover:text-[#004b3a]">
              Voir tout
            </Link>
          </div>

          {recentScans.length > 0 ? (
            <div className="divide-y divide-[#dfe8df]">
              {recentScans.map((scan) => {
                const status = scan.analysis?.status || scan.status;
                const style = getStatusStyle(status);
                return (
                  <article key={scan.id} className="flex flex-col gap-3 px-5 py-4 transition hover:bg-[#f7f8f6] sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#1d252b]">{scan.name || scan.textPreview || 'Produit analysé'}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatScanDate(scan)}</p>
                    </div>
                    <span className={`status-pill ${style.badge}`}>{scan.analysis?.label || style.label}</span>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <ScanLine className="mx-auto h-9 w-9 text-[#a8cfa5]" aria-hidden="true" />
              <p className="mt-3 font-bold text-[#1d252b]">Aucune analyse sauvegardée</p>
              <p className="mt-2 text-sm text-slate-500">Lancez votre premier scan pour remplir cet espace.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function TrustCard({ icon: Icon, title, copy }) {
  return (
    <article className="soft-card p-5">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f4e8] text-[#008f45]">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-lg font-extrabold text-[#1d252b]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
    </article>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4 text-center">
      <p className="text-2xl font-extrabold text-[#1d252b]">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </div>
  );
}

function formatScanDate(scan) {
  const value = scan.createdAt || scan.date || scan.id || Date.now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('fr-FR');
}
