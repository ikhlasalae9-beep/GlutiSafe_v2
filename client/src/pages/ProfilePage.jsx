import { Bell, Mail, Save, ShieldCheck, SlidersHorizontal, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { clearStoredUser, getStoredUser } from '../lib/auth.js';
import { getHistory, isAlertHistoryItem, isSafeHistoryItem } from '../lib/history.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    setUser(currentUser);
    setHistory(getHistory(currentUser));
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
                onClick={() => {
                  clearStoredUser();
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
      <input className="field-control mt-2" defaultValue={value} />
    </label>
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
