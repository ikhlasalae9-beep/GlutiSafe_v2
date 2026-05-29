import { KeyRound, Loader2, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
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
  const [sessionStatus, setSessionStatus] = useState('checking');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    async function loadRecoverySession() {
      if (!supabase) {
        if (active) {
          setError('Base de données non configurée.');
          setSessionStatus('invalid');
        }
        return;
      }

      try {
        const code = getUrlParam('code');
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (accessToken && refreshToken) {
          const { error: tokenError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (tokenError) throw tokenError;
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!active) return;
        setSessionStatus(data.session ? 'valid' : 'invalid');
        if (!data.session) setError('Le lien de réinitialisation est invalide ou expiré.');
      } catch (_sessionError) {
        if (!active) return;
        setSessionStatus('invalid');
        setError('Le lien de réinitialisation est invalide ou expiré.');
      }
    }

    loadRecoverySession();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!password || password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (!confirmPassword || password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (sessionStatus !== 'valid') {
      setError('Le lien de réinitialisation est invalide ou expiré.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess('Votre mot de passe a été mis à jour avec succès.');
      window.setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (_updateError) {
      setError('Impossible de mettre à jour le mot de passe. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  const isChecking = sessionStatus === 'checking';
  const isInvalid = sessionStatus === 'invalid';

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-4 py-8 text-[#1d252b] sm:px-6">
      <section className="surface-card mx-auto mt-16 w-full max-w-md p-6 shadow-[0_24px_70px_rgba(29,37,43,0.12)] sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <img src="/logo.png" alt="Logo GlutiSafe" className="h-12 w-12 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[#dfe8df]" />
          <div>
            <p className="text-2xl font-extrabold tracking-tight">GlutiSafe</p>
            <p className="text-sm text-slate-500">Nouveau mot de passe</p>
          </div>
        </div>

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f4e8] text-[#008f45]">
          {isChecking ? <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" /> : null}
          {isInvalid ? <ShieldAlert className="h-7 w-7 text-red-700" aria-hidden="true" /> : null}
          {!isChecking && !isInvalid ? <KeyRound className="h-7 w-7" aria-hidden="true" /> : null}
        </div>

        <h1 className="text-3xl font-black text-[#1d252b]">Nouveau mot de passe</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Choisissez un nouveau mot de passe pour sécuriser votre compte GlutiSafe.
        </p>

        {isInvalid ? (
          <div className="mt-6">
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error || 'Le lien de réinitialisation est invalide ou expiré.'}
            </p>
            <Button className="mt-5 w-full" type="button" onClick={() => navigate('/forgot-password')} icon={ShieldCheck}>
              Demander un nouveau lien
            </Button>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <PasswordField label="Nouveau mot de passe" value={password} onChange={setPassword} />
            <PasswordField label="Confirmer le mot de passe" value={confirmPassword} onChange={setConfirmPassword} />

            {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
            {success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{success}</p> : null}

            <Button className="w-full" type="submit" disabled={loading || isChecking} icon={ShieldCheck}>
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </Button>
          </form>
        )}

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
        <input className="w-full bg-transparent outline-none placeholder:text-slate-400" type="password" required value={value} onChange={(event) => onChange(event.target.value)} />
      </span>
    </label>
  );
}

function getUrlParam(name) {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return searchParams.get(name) || hashParams.get(name);
}
