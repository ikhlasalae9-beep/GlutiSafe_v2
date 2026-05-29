import { Lock, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { updatePassword } from '../lib/auth.js';
import { supabase } from '../lib/supabaseClient.js';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    async function loadSession() {
      if (!supabase) {
        setError('Base de données non configurée.');
        return;
      }

      const { error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError) setError(sessionError.message || 'Session de réinitialisation invalide.');
      setReady(true);
    }

    loadSession();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess('Votre mot de passe a été mis à jour.');
      window.setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (updateError) {
      setError(updateError.message || 'Impossible de mettre à jour le mot de passe.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-4 py-8 text-[#1d252b] sm:px-6">
      <section className="surface-card mx-auto mt-16 w-full max-w-md p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <img src="/logo.png" alt="Logo GlutiSafe" className="h-12 w-12 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[#dfe8df]" />
          <div>
            <p className="text-2xl font-extrabold tracking-tight">GlutiSafe</p>
            <p className="text-sm text-slate-500">Nouveau mot de passe</p>
          </div>
        </div>
        <h1 className="text-3xl font-black text-[#1d252b]">Nouveau mot de passe</h1>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <PasswordField label="Nouveau mot de passe" value={password} onChange={setPassword} />
          <PasswordField label="Confirmer le mot de passe" value={confirmPassword} onChange={setConfirmPassword} />
          {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
          {success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{success}</p> : null}
          <Button className="w-full" type="submit" disabled={loading || !ready} icon={ShieldCheck}>
            {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link className="font-bold text-[#008f45] hover:text-[#004b3a]" to="/login">
            Retour à la connexion
          </Link>
        </p>
      </section>
    </main>
  );
}

function PasswordField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <span className="mt-2 flex items-center gap-3 rounded-2xl border border-[#dfe8df] bg-white px-4 py-3 focus-within:border-[#008f45] focus-within:ring-4 focus-within:ring-[#a8cfa5]/35">
        <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
        <input className="w-full bg-transparent outline-none" type="password" required value={value} onChange={(event) => onChange(event.target.value)} />
      </span>
    </label>
  );
}
