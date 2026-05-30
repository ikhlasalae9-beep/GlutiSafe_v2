import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentProfile } from '../lib/auth.js';
import { isLoginVerified } from '../lib/loginSecurity.js';
import { isSupabaseConfigured } from '../lib/supabaseClient.js';

export default function ProtectedRoute({ adminOnly = false }) {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, profile: null, error: '' });
  const redirectTarget = `${location.pathname}${location.search}`;

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!isSupabaseConfigured) {
        if (active) {
          setState({
            loading: false,
            profile: null,
            error: 'Connexion indisponible pour le moment. Veuillez réessayer plus tard.',
          });
        }
        return;
      }

      try {
        const profile = await getCurrentProfile();
        if (active) setState({ loading: false, profile, error: '' });
      } catch (error) {
        if (active) setState({ loading: false, profile: null, error: error.message || 'Impossible de charger le profil.' });
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [location.key]);

  if (state.loading) {
    return <div className="grid min-h-screen place-items-center bg-[#f7f8f6] px-4 text-sm font-bold text-slate-600">Chargement du profil...</div>;
  }

  if (state.error) {
    return <div className="grid min-h-screen place-items-center bg-[#f7f8f6] px-4 text-center text-sm font-bold text-red-700">{state.error}</div>;
  }

  if (!state.profile) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTarget)}`} replace state={{ from: location }} />;
  }

  if (!isLoginVerified()) {
    return <Navigate to={`/verify-login?redirect=${encodeURIComponent(redirectTarget)}`} replace state={{ from: location }} />;
  }

  if (adminOnly && state.profile.role !== 'admin') {
    return <Navigate to="/analyse" replace />;
  }

  return <Outlet />;
}
