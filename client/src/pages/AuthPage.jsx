import { HeartPulse, Leaf, Lock, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { loginUser, registerUser } from '../lib/auth.js';
import { checkTrustedDeviceAfterLogin, markLoginVerified, sendLoginCode } from '../lib/loginSecurity.js';

export default function AuthPage({ mode = 'register' }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const requestedRedirect = searchParams.get('redirect') || location.state?.from?.pathname || '/analyse';
  const redirectTo = requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//') ? requestedRedirect : '/analyse';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (isRegister && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await registerUser({ name, email, password });
        setSuccess('Compte créé avec succès. Redirection vers le scanner...');
        window.setTimeout(() => navigate(redirectTo, { replace: true }), 350);
        return;
      }

      await loginUser({ email, password });
      setSuccess('Envoi du code de vérification...');
      const trusted = await checkTrustedDeviceAfterLogin();
      if (trusted.trusted) {
        markLoginVerified(true);
        navigate(redirectTo, { replace: true });
        return;
      }

      markLoginVerified(false);
      await sendLoginCode();
      navigate(`/verify-login?redirect=${encodeURIComponent(redirectTo)}`, { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Impossible de finaliser cette action.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-4 py-6 text-[#1d252b] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="organic-panel hidden rounded-[2rem] bg-[#004b3a] p-10 text-white shadow-2xl lg:block">
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-[#a8cfa5]" aria-hidden="true" />
              Safe Gluten-Free Dining
            </span>
            <h1 className="mt-8 max-w-xl text-5xl font-extrabold leading-tight tracking-tight">
              Une plateforme claire pour vérifier vos étiquettes.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/78">
              Connectez-vous pour accéder au scanner, conserver vos analyses et retrouver vos résultats plus vite.
            </p>
            <div className="mt-10 grid max-w-xl grid-cols-2 gap-4">
              <Feature icon={Leaf} label="Ingrédients plus lisibles" />
              <Feature icon={HeartPulse} label="Expérience rassurante" />
            </div>
          </div>
        </section>

        <section className="surface-card mx-auto w-full max-w-md p-6 sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <img src="/logo.png" alt="Logo GlutiSafe" className="h-12 w-12 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[#dfe8df]" />
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-[#1d252b]">GlutiSafe</p>
              <p className="text-sm text-slate-500">{isRegister ? 'Créer votre compte' : 'Bon retour'}</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isRegister ? (
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Nom</span>
                <Field icon={UserRound} placeholder="Votre nom" required type="text" value={name} onChange={(event) => setName(event.target.value)} />
              </label>
            ) : null}
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Email</span>
              <Field icon={Mail} placeholder="vous@example.com" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Mot de passe</span>
              <Field icon={Lock} placeholder="Votre mot de passe" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {isRegister ? (
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Confirmer le mot de passe</span>
                <Field icon={Lock} placeholder="Confirmez votre mot de passe" required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </label>
            ) : null}
            {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
            {success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{success}</p> : null}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? (isRegister ? 'Veuillez patienter...' : 'Envoi du code...') : isRegister ? 'Créer mon compte' : 'Se connecter'}
            </Button>
          </form>

          {!isRegister ? (
            <p className="mt-5 text-center text-sm">
              <Link className="font-bold text-[#008f45] hover:text-[#004b3a]" to="/forgot-password">
                Mot de passe oublié ?
              </Link>
            </p>
          ) : null}

          <p className="mt-6 text-center text-sm text-slate-500">
            {isRegister ? 'Déjà un compte ?' : 'Besoin de créer un compte ?'}{' '}
            <Link className="font-bold text-[#008f45] hover:text-[#004b3a]" to={`${isRegister ? '/login' : '/register'}?redirect=${encodeURIComponent(redirectTo)}`}>
              {isRegister ? 'Se connecter' : 'Créer un compte'}
            </Link>
          </p>
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

function Feature({ icon: Icon, label }) {
  return (
    <div className="rounded-[1.25rem] border border-white/15 bg-white/10 p-5">
      <Icon className="h-7 w-7 text-[#a8cfa5]" aria-hidden="true" />
      <p className="mt-4 font-bold">{label}</p>
    </div>
  );
}
