import { LogOut, MailCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { signOut } from '../lib/auth.js';
import { markLoginVerified, sendLoginCode, verifyLoginCode } from '../lib/loginSecurity.js';

const RESEND_SECONDS = 60;

export default function VerifyLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = sanitizeRedirect(searchParams.get('redirect') || '/analyse');
  const [code, setCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  const codeReady = useMemo(() => /^\d{6}$/.test(code), [code]);

  useEffect(() => {
    markLoginVerified(false);
    if (!maskedEmail) {
      handleResend({ initial: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = window.setTimeout(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  async function handleVerify(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await verifyLoginCode({ code, rememberDevice });
      setMessage('Connexion vérifiée avec succès.');
      window.setTimeout(() => navigate(redirectTo, { replace: true }), 250);
    } catch (verifyError) {
      setError(cleanVerifyMessage(verifyError));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend({ initial = false } = {}) {
    if (!initial && resendIn > 0) return;
    setError('');
    setMessage('');
    setResending(true);

    try {
      const result = await sendLoginCode();
      if (result.email) setMaskedEmail(result.email);
      setResendIn(RESEND_SECONDS);
      if (!initial) setMessage('Un nouveau code a été envoyé.');
    } catch {
      setError("Impossible d’envoyer le code pour le moment. Réessayez dans un instant.");
    } finally {
      setResending(false);
    }
  }

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8f6] px-4 py-8 text-[#1d252b]">
      <section className="surface-card w-full max-w-md p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <img src="/logo.png" alt="Logo GlutiSafe" className="h-12 w-12 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[#dfe8df]" />
          <div>
            <p className="text-2xl font-extrabold tracking-tight">GlutiSafe</p>
            <p className="text-sm text-slate-500">Sécurité du compte</p>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-5">
          <MailCheck className="h-8 w-8 text-[#008f45]" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-extrabold">Vérification de connexion</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Nous avons envoyé un code de sécurité à votre adresse e-mail.
          </p>
          {maskedEmail ? <p className="mt-2 text-sm font-black text-[#008f45]">Code envoyé à {maskedEmail}</p> : null}
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleVerify}>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Code à 6 chiffres</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="field-control mt-2 text-center text-2xl font-black tracking-[0.4em]"
              placeholder="123456"
            />
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-[#dfe8df] bg-white p-4 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#008f45]"
            />
            <span>Se souvenir de cet appareil pendant 7 jours</span>
          </label>

          {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
          {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}

          <Button className="w-full" type="submit" disabled={loading || !codeReady}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {loading ? 'Vérification...' : 'Vérifier le code'}
          </Button>
        </form>

        <div className="mt-4 grid gap-3">
          <button type="button" onClick={() => handleResend()} disabled={resending || resendIn > 0} className="secondary-btn w-full">
            <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} aria-hidden="true" />
            {resendIn > 0 ? `Renvoyer le code dans ${resendIn}s` : 'Renvoyer le code'}
          </button>
          <button type="button" onClick={handleLogout} className="ghost-btn w-full">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Se déconnecter
          </button>
        </div>
      </section>
    </main>
  );
}

function cleanVerifyMessage(error) {
  if (error.code === 'wrong_code') return 'Code incorrect. Veuillez réessayer.';
  if (error.code === 'expired') return 'Code expiré. Demandez un nouveau code.';
  if (error.code === 'too_many_attempts') return 'Trop de tentatives. Demandez un nouveau code.';
  return error.message || 'Code incorrect. Veuillez réessayer.';
}

function sanitizeRedirect(value) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/analyse';
}
