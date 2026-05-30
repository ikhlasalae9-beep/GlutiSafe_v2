import { useEffect, useRef } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ChatbotWidget from './components/ChatbotWidget.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SidebarLayout from './components/SidebarLayout.jsx';
import { supabase } from './lib/supabaseClient.js';
import { clearUserScopedState } from './lib/userScopedState.js';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AnalysisPage from './pages/AnalysisPage.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import HomePage from './pages/HomePage.jsx';
import PacksPage from './pages/PacksPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import VerifyLoginPage from './pages/VerifyLoginPage.jsx';

export default function App() {
  const currentUserIdRef = useRef('');

  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getUser().then(({ data }) => {
      currentUserIdRef.current = data.user?.id || '';
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user?.id || '';

      if (event === 'SIGNED_OUT') {
        currentUserIdRef.current = '';
        clearUserScopedState({ reason: 'signed_out' });
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && nextUserId && currentUserIdRef.current !== nextUserId) {
        currentUserIdRef.current = nextUserId;
        clearUserScopedState({ reason: 'user_changed', nextUserId, preserveLoginVerification: true });
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <>
      <Routes>
        <Route element={<SidebarLayout />}>
          <Route path="/" element={<HomePage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<SidebarLayout />}>
          <Route path="/analyse" element={<AnalysisPage />} />
          <Route path="/analyser" element={<Navigate to="/analyse" replace />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/packs" element={<PacksPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/signup" element={<AuthPage mode="register" />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/verify-login" element={<VerifyLoginPage />} />
        <Route path="/admin-secure" element={<AdminLoginPage />} />
        <Route path="/admin-login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatbotWidget />
    </>
  );
}
