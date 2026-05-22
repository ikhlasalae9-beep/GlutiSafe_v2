import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getPrincipalAdminSession } from '../lib/adminAuth.js';
import { getStoredUser } from '../lib/auth.js';

export default function ProtectedRoute({ adminOnly = false }) {
  const location = useLocation();
  const adminSession = getPrincipalAdminSession();
  const user = getStoredUser();
  const redirectTarget = `${location.pathname}${location.search}`;

  if (adminOnly) {
    return adminSession ? <Outlet /> : <Navigate to="/admin-secure" replace />;
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTarget)}`} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
