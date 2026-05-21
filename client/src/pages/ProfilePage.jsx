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

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-teal-700 text-white shadow-lg shadow-teal-900/20">
              <UserRound className="h-10 w-10" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">{user.name || 'Guest User'}</h1>
              <p className="mt-2 flex items-center gap-2 text-slate-500">
                <Mail className="h-4 w-4" aria-hidden="true" />
                {user.email || 'guest@example.com'}
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              ['Saved', history.length],
              ['Safe', history.filter(isSafeHistoryItem).length],
              ['Alerts', history.filter(isAlertHistoryItem).length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-4 text-center ring-1 ring-slate-200">
                <p className="text-2xl font-black">{value}</p>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <Panel icon={UserRound} title="Personal information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={user.name || 'Guest User'} />
              <Field label="Email" value={user.email || 'guest@example.com'} />
            </div>
          </Panel>

          <Panel icon={SlidersHorizontal} title="Dietary preferences">
            <div className="grid gap-3 sm:grid-cols-2">
              {['Strict gluten-free', 'Avoid barley', 'Avoid rye', 'Watch added sugars'].map((item) => (
                <label key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-cyan-300" />
                  <span className="font-semibold text-slate-700">{item}</span>
                </label>
              ))}
            </div>
          </Panel>

          <Panel icon={Bell} title="Account controls">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-cyan-300" />
                <span className="font-semibold text-slate-700">Product safety reminders</span>
              </label>
              <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-cyan-300" />
                <span className="font-semibold text-slate-700">Weekly nutrition summary</span>
              </label>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button icon={Save}>Save Changes</Button>
              <Button variant="secondary" icon={ShieldCheck}>Export My Data</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  clearStoredUser();
                  navigate('/login', { replace: true });
                }}
              >
                Sign Out
              </Button>
            </div>
          </Panel>
        </section>
    </div>
  );
}

function Panel({ icon: Icon, title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-teal-700 ring-1 ring-cyan-100">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
        defaultValue={value}
      />
    </label>
  );
}
