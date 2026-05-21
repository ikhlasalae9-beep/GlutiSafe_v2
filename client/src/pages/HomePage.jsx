import { AlertTriangle, Camera, CheckCircle2, FileText, ImagePlus, ScanSearch, ShieldCheck, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStoredUser } from '../lib/auth.js';

export default function HomePage() {
  const currentUser = getStoredUser();
  const displayName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Utilisateur';
  const userHistory = getUserHistory(currentUser);
  const recentScans = userHistory.slice(0, 3);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-200 rounded-xl p-8 shadow-lg w-full">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Bonjour, {displayName} ! ✨
          </h1>
          <p className="text-lg text-slate-200 font-medium">
            Prêt à scanner vos produits en toute sécurité aujourd'hui ?
          </p>
          <p className="text-sm text-slate-300 mt-4">
            Gardez une vue claire sur vos analyses, vos alertes et vos habitudes alimentaires en un coup d'oeil.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-teal-700">Comment ca marche ?</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Analysez vos produits en 3 etapes</h2>
          </div>
          <p className="max-w-xl leading-7 text-slate-600">
            Un flux simple, lisible et pense pour vous aider a prendre une decision alimentaire plus sure.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <HowItWorksCard
            icon={ImagePlus}
            title="1. Scannez ou Importez"
            description="Prenez en photo la liste des ingredients de votre produit ou importez une image depuis votre galerie."
          />
          <HowItWorksCard
            icon={ScanSearch}
            title="2. Analyse Intelligente"
            description="Notre systeme lit le texte et notre IA verifie instantanement la presence de gluten ou de termes a risque."
          />
          <HowItWorksCard
            icon={ShieldCheck}
            title="3. Resultat & Securite"
            description="Obtenez un verdict clair (Sain ou Danger) avec une explication detaillee pour consommer en toute tranquillite."
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Link
          to="/analyse"
          className="group relative overflow-hidden rounded-2xl border border-cyan-100 bg-white p-7 shadow-xl shadow-slate-200/70 transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-cyan-200/60"
        >
          <div className="absolute right-6 top-6 h-28 w-28 rounded-full bg-cyan-100/60 blur-2xl transition group-hover:scale-125" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-teal-600 text-white shadow-xl shadow-teal-900/20 transition group-hover:scale-105 group-hover:animate-pulse">
              <Camera className="h-9 w-9" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-teal-700">Nouvelle analyse</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Lancer une nouvelle analyse</h2>
              <p className="mt-3 max-w-xl leading-7 text-slate-600">
                Importez une photo d'etiquette, lancez la detection et obtenez un rapport lisible en quelques secondes.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/20">
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                Scanner maintenant
              </div>
            </div>
          </div>
        </Link>

        <article className="rounded-2xl border border-sky-100 bg-sky-50 p-6 shadow-xl shadow-slate-200/60">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm ring-1 ring-sky-100">
              <FileText className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-700">Le Conseil du Jour</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Reperez les termes caches</h2>
              <p className="mt-3 leading-7 text-slate-600">
                En magasin, surveillez les mots comme malt, orge, seigle, levure de biere et amidon modifie lorsque
                l'origine n'est pas precisee. Les sauces, soupes et melanges d'epices peuvent en contenir.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-teal-700">Recent scans</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Dernieres analyses</h2>
          </div>
          <Link to="/history" className="text-sm font-black text-teal-700 hover:text-cyan-600">
            Voir tout
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50">
              <tr>
                {['Product name', 'Date', 'Status'].map((heading) => (
                  <th key={heading} scope="col" className="px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentScans.length > 0 ? (
                recentScans.map((scan) => (
                  <tr key={scan.id || `${scan.name}-${scan.date}`} className="transition hover:bg-cyan-50/40">
                    <td className="px-5 py-4 font-bold text-slate-950">{scan.name || 'Produit Scanné'}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatScanDate(scan)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={scan.status || scan.analysis?.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-5 py-4 text-center text-sm italic text-slate-500">
                    Aucune analyse récente. Commencez par scanner un produit !
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function getUserHistory(currentUser) {
  const email = currentUser?.email?.trim().toLowerCase();
  if (!email) return [];

  try {
    return JSON.parse(localStorage.getItem(`history_${email}`) || '[]');
  } catch {
    return [];
  }
}

function formatScanDate(scan) {
  if (scan.date) return scan.date;

  const value = scan.createdAt || scan.id || Date.now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toLocaleDateString() : date.toLocaleDateString();
}

function HowItWorksCard({ icon: Icon, title, description }) {
  return (
    <article className="group rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-cyan-200 hover:bg-white hover:shadow-xl hover:shadow-cyan-100/70">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-teal-700 ring-1 ring-cyan-100 transition group-hover:scale-105 group-hover:bg-gradient-to-br group-hover:from-teal-500 group-hover:to-cyan-500 group-hover:text-white">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-lg font-black tracking-tight text-slate-950">{title}</h3>
      <p className="mt-3 leading-7 text-slate-600">{description}</p>
    </article>
  );
}

function StatusBadge({ status }) {
  const isSafe = status === 'safe';
  const Icon = isSafe ? CheckCircle2 : AlertTriangle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ring-1 ${
        isSafe ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-red-50 text-red-700 ring-red-200'
      }`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {isSafe ? 'Safe' : 'Danger'}
    </span>
  );
}
