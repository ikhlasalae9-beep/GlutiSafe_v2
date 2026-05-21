import { Navigate, Route, Routes } from 'react-router-dom';
import ChatbotWidget from './components/ChatbotWidget.jsx';
import SidebarLayout from './components/SidebarLayout.jsx';
import AnalysisPage from './pages/AnalysisPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<SidebarLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyse" element={<AnalysisPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
      <ChatbotWidget />
    </>
  );
}
