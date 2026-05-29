import { Bell, Mail, Save, ShieldCheck, SlidersHorizontal, UserRound, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { getMyAiMessageUsage } from '../lib/aiUsage.js';
import { getCurrentProfile, signOut } from '../lib/auth.js';
import { getHistory, isAlertHistoryItem, isSafeHistoryItem } from '../lib/history.js';
import { getMyPaymentRequests } from '../lib/payments.js';
import { formatTokenReset, getTokenSnapshot } from '../lib/packUsage.js';
import { PACKS } from '../lib/packs.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [aiUsage, setAiUsage] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const currentUser = await getCurrentProfile();
      if (!currentUser) {
        navigate('/login', { replace: true });
        return;
      }

      const [rows, snapshot, requests, aiMessages] = await Promise.all([getHistory(), getTokenSnapshot(currentUser), getMyPaymentRequests(), getMyAiMessageUsage(currentUser.id)]);
      if (!active) return;
      setUser(currentUser);
      setHistory(rows);
      setTokenInfo(snapshot);
      setAiUsage(aiMessages);
      setPendingRequest(requests.find((request) => request.status === 'pending') || null);
    }

    loadProfile().catch(() => {
      if (active) navigate('/login', { replace: true });
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="page-shell page-section">
      <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <section className="surface-card organic-panel p-6">
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#004b3a] text-white shadow-lg">
                <UserRound className="h-10 w-10" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="brand-kicker">Profil</p>
                <h1 className="mt-1 truncate text-3xl font-extrabold tracking-tight text-[#1d252b]">{user.name}</h1>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {user.email}
                </p>
              </div>
            </div>
            <div className="mt-7 grid grid-cols-3 gap-3">
              <Metric label="Sauvegardées" value={history.length} />
              <Metric label="OK" value={history.filter(isSafeHistoryItem).length} />
              <Metric label="Alertes" value={history.filter(isAlertHistoryItem).length} />
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">Pack actuel</p>
              <p className="mt-1 text-lg font-black text-[#1d252b]">{user.packDescription || user.packDisplayName || 'Pack Gratuit'}</p>
              <p className="mt-1 text-xs font-bold text-slate-600">{user.packStatusLabel || 'Gratuit'}</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <Panel icon={UserRound} title="Informations personnelles">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom complet" value={user.name} />
              <Field label="Email" value={user.email} />
            </div>
          </Panel>

          <Panel icon={SlidersHorizontal} title="Préférences alimentaires">
            <div className="grid gap-3 sm:grid-cols-2">
              {['Strict sans gluten', 'Éviter orge', 'Éviter seigle', 'Surveiller sucres ajoutés'].map((item) => (
                <label key={item} className="flex items-center gap-3 rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
                  <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-slate-300 text-[#008f45] focus:ring-[#a8cfa5]" />
                  <span className="font-semibold text-slate-700">{item}</span>
                </label>
              ))}
            </div>
          </Panel>

          <Panel icon={WalletCards} title="Pack et abonnement">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Pack" value={user.packDescription || user.packDisplayName || 'Pack Gratuit'} />
              <Field label="Statut" value={user.packStatusLabel || 'Gratuit'} />
              <Field label="Fin du pack" value={formatDate(user.packEndAt)} />
              <Field label="Demande en attente" value={pendingRequest ? `${pendingRequest.pack_type} - ${pendingRequest.payment_method}` : '-'} />
            </div>
          </Panel>

          <Panel icon={WalletCards} title="Usage">
            <UsageSection user={user} tokenInfo={tokenInfo} aiUsage={aiUsage} />
          </Panel>

          <Panel icon={Bell} title="Contrôle du compte">
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Rappels de sécurité produit" checked />
              <Toggle label="Résumé nutritionnel hebdomadaire" />
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button icon={Save}>Enregistrer</Button>
              <Button variant="secondary" icon={ShieldCheck}>Exporter mes données</Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  await signOut();
                  navigate('/', { replace: true });
                }}
              >
                Déconnexion
              </Button>
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

function Panel({ icon: Icon, title, children }) {
  return (
    <section className="surface-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f4e8] text-[#008f45]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      <h2 className="text-xl font-extrabold text-[#1d252b]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input className="field-control mt-2" value={value || '-'} readOnly />
    </label>
  );
}

function UsageSection({ user, tokenInfo, aiUsage }) {
  const used = Number(tokenInfo?.used || 0);
  const limit = Number(tokenInfo?.limit || 0);
  const remaining = Number(tokenInfo?.remaining || 0);
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const tone = percentage >= 100 ? 'bg-red-600' : percentage >= 80 ? 'bg-amber-500' : 'bg-[#008f45]';

  return (
    <div className="rounded-[1.25rem] border border-[#dfe8df] bg-[#f7f8f6] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#008f45]">Pack actuel</p>
          <h3 className="mt-1 text-2xl font-black text-[#1d252b]">{getUsagePackLabel(user, tokenInfo)}</h3>
          <p className="mt-2 text-sm font-semibold text-slate-600">{getUsageInfoLabel(user, tokenInfo)}</p>
        </div>
        <div className="rounded-2xl border border-[#dfe8df] bg-white px-4 py-3 text-right">
          <p className="text-2xl font-black text-[#1d252b]">{Math.round(percentage)}%</p>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">utilisé</p>
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white ring-1 ring-[#dfe8df]">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${percentage}%` }} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <UsageMetric label="Tokens utilisés" value={`${used} / ${limit}`} />
        <UsageMetric label="Tokens restants" value={remaining} />
        <UsageMetric label="Limite" value={limit} />
      </div>
      <ul className="mt-5 grid gap-2 rounded-2xl border border-[#dfe8df] bg-white p-4 text-sm font-bold text-slate-700 sm:grid-cols-2">
        {getUsageFeatures(user, tokenInfo).map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#008f45]" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {isFreeUsage(user, tokenInfo) ? (
        <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-black ${Number(aiUsage?.used || 0) >= 5 ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-white text-emerald-800'}`}>
          Assistant IA : {Number(aiUsage?.used || 0)} / 5 messages utilisés
          {Number(aiUsage?.used || 0) >= 5 ? ' - Limite IA atteinte' : ''}
        </p>
      ) : null}
    </div>
  );
}

function UsageMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#dfe8df] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black text-[#1d252b]">{value}</p>
    </div>
  );
}

function Toggle({ label, checked = false }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
      <input type="checkbox" defaultChecked={checked} className="h-5 w-5 rounded border-slate-300 text-[#008f45] focus:ring-[#a8cfa5]" />
      <span className="font-semibold text-slate-700">{label}</span>
    </label>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#dfe8df] bg-white/80 p-4 text-center">
      <p className="text-2xl font-extrabold text-[#1d252b]">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </div>
  );
}

function getUsagePackLabel(user, tokenInfo) {
  if (user.packStatus === 'blocked' || tokenInfo?.packStatus === 'blocked') return 'Compte bloqué';
  if (user.packStatus === 'pending') return 'Demande en attente';
  if (user.packStatus === 'expired') return 'Pack expiré';
  if (tokenInfo?.packStatus === 'active' && tokenInfo.packType === 'monthly') return 'Pack Mensuel';
  if (tokenInfo?.packStatus === 'active' && tokenInfo.packType === 'yearly') return 'Pack Annuel';
  return 'Pack Gratuit';
}

function getUsageInfoLabel(user, tokenInfo) {
  if (!tokenInfo) return '-';
  if (user.packStatus === 'blocked' || tokenInfo.packStatus === 'blocked') return "Votre compte est bloqué. Contactez l'administration.";
  if (user.packStatus === 'pending') return 'Votre demande est en attente de vérification administrateur.';
  if (tokenInfo.packStatus === 'active' && tokenInfo.packType === 'monthly') return `Pack Mensuel actif - Réinitialisation : ${formatResetLabel(tokenInfo.periodStart, tokenInfo.periodEnd)}`;
  if (tokenInfo.packStatus === 'active' && tokenInfo.packType === 'yearly') return `Pack Annuel actif jusqu'au ${formatDate(user.packEndAt)} - Réinitialisation : ${formatResetLabel(tokenInfo.periodStart, tokenInfo.periodEnd)}`;
  if (user.packStatus === 'expired') return 'Pack expiré. Vous utilisez les limites du Pack Gratuit.';
  return `Réinitialisation : ${formatResetLabel(tokenInfo.periodStart, tokenInfo.periodEnd)}`;
}

function isFreeUsage(user, tokenInfo) {
  return user.packStatus !== 'active' || tokenInfo?.packStatus !== 'active';
}

function getUsageFeatures(user, tokenInfo) {
  if (user.packStatus === 'active' && tokenInfo?.packStatus === 'active') {
    return PACKS.find((pack) => pack.packType === tokenInfo.packType)?.features || PACKS[0].features;
  }

  return PACKS[0].features;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}

function formatResetLabel(periodStart, periodEnd) {
  if (!periodStart || !periodEnd) return '-';
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const windowHours = Math.round((end.getTime() - start.getTime()) / 36e5);
  const hours = [10, 48, 336, 1440].includes(windowHours) ? windowHours / 2 : windowHours;
  if (hours === 5) return 'toutes les 5h';
  if (hours === 24) return 'chaque 24 heures';
  if (hours === 168) return 'chaque 7 jours';
  if (hours === 720) return 'chaque 30 jours';
  return formatTokenReset(periodEnd);
}
