import { Navigate, Route, Routes } from 'react-router-dom';
import ChatbotWidget from './components/ChatbotWidget.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SidebarLayout from './components/SidebarLayout.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AnalysisPage from './pages/AnalysisPage.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import AuthPage from './pages/AuthPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import HomePage from './pages/HomePage.jsx';
import PacksPage from './pages/PacksPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

export default function App() {
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
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/admin-secure" element={<AdminLoginPage />} />
        <Route path="/admin-login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatbotWidget />
    </>
  );
}
