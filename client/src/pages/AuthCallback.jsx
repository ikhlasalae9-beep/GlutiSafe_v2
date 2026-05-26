import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { supabase } from '../lib/supabaseClient.js';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', session: null, error: '' });

  useEffect(() => {
    let active = true;
    let redirectTimer;

    async function processSession() {
      if (!supabase) {
        if (active) {
          setState({
            status: 'error',
            session: null,
            error: 'Base de données non configurée. Ajoutez les variables Supabase dans Vercel.',
          });
        }
        return;
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!active) return;
        const session = data.session || null;
        setState({ status: session ? 'success' : 'no-session', session, error: '' });

        if (session) {
          redirectTimer = window.setTimeout(() => navigate('/analyse', { replace: true }), 3000);
        }
      } catch (error) {
        if (active) {
          setState({
            status: 'error',
            session: null,
            error: error.message || "La vérification de l'e-mail a échoué.",
          });
        }
      }
    }

    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      if (!active || !session) return;
      setState({ status: 'success', session, error: '' });
    }).data?.subscription;

    processSession();

    return () => {
      active = false;
      if (redirectTimer) window.clearTimeout(redirectTimer);
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const isLoading = state.status === 'loading';
  const isSuccess = state.status === 'success';
  const isNoSession = state.status === 'no-session';
  const isError = state.status === 'error';

  function handleContinue() {
    navigate(state.session ? '/analyse' : '/login', { replace: true });
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-4 py-8 text-[#1d252b] sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl place-items-center">
        <section className="surface-card organic-panel w-full max-w-lg p-6 text-center shadow-[0_24px_70px_rgba(29,37,43,0.12)] sm:p-9">
          <div className="relative">
            <img src="/logo.png" alt="Logo GlutiSafe" className="mx-auto h-16 w-16 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[#dfe8df]" />

            <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f4e8] text-[#008f45]">
              {isLoading ? <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" /> : null}
              {isSuccess || isNoSession ? <CheckCircle2 className="h-8 w-8" aria-hidden="true" /> : null}
              {isError ? <ShieldAlert className="h-8 w-8 text-red-700" aria-hidden="true" /> : null}
            </div>

            <p className="brand-kicker mt-8">GlutiSafe</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#1d252b] sm:text-4xl">
              {isLoading ? 'Vérification en cours...' : 'E-mail confirmé avec succès'}
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm font-semibold leading-7 text-slate-600 sm:text-base">
              {isLoading ? 'Nous finalisons la confirmation de votre compte GlutiSafe.' : null}
              {isSuccess ? 'Votre adresse e-mail a été vérifiée. Vous pouvez maintenant accéder à votre espace GlutiSafe.' : null}
              {isNoSession ? 'Votre e-mail est peut-être confirmé, veuillez vous connecter.' : null}
              {isError ? state.error : null}
            </p>

            {isSuccess ? <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[#008f45]">Redirection automatique dans 3 secondes</p> : null}

            {!isLoading ? (
              <Button className="mx-auto mt-8 px-6" onClick={handleContinue}>
                Accéder à la plateforme
              </Button>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
