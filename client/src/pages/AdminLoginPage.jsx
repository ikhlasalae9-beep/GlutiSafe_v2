import { ArrowLeft, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { loginPrincipalAdmin } from '../lib/adminAuth.js';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      loginPrincipalAdmin({ identifier, password });
      navigate('/admin', { replace: true });
    } catch {
      setError('Identifiant ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-4 py-8 text-[#1d252b] sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl place-items-center">
        <section className="surface-card organic-panel w-full max-w-md p-6 sm:p-8">
          <div className="relative">
            <Link to="/" className="secondary-btn mb-8 px-4">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Retour au site
            </Link>

            <div className="mb-8 flex items-center gap-3">
              <img src="/logo.png" alt="Logo GlutiSafe" className="h-12 w-12 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[#dfe8df]" />
              <div>
                <p className="text-2xl font-extrabold tracking-tight">GlutiSafe Admin</p>
                <p className="text-sm text-slate-500">Accès privé</p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Identifiant</span>
                <Field icon={KeyRound} placeholder="Identifiant admin" required type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Mot de passe</span>
                <Field icon={Lock} placeholder="Mot de passe admin" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? 'Vérification...' : 'Connexion admin'}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#008f45]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Principal admin
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ icon: Icon, ...props }) {
  return (
    <span className="mt-2 flex items-center gap-3 rounded-2xl border border-[#dfe8df] bg-white px-4 py-3 focus-within:border-[#008f45] focus-within:ring-4 focus-within:ring-[#a8cfa5]/35">
      <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />
      <input className="w-full bg-transparent text-[#1d252b] outline-none placeholder:text-slate-400" {...props} />
    </span>
  );
}
