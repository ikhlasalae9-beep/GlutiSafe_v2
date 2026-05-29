import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminAiUsagePage from '../components/admin/AdminAiUsagePage.jsx';
import AdminAnalysesPage from '../components/admin/AdminAnalysesPage.jsx';
import AdminLayout from '../components/admin/AdminLayout.jsx';
import AdminOverviewPage from '../components/admin/AdminOverviewPage.jsx';
import AdminPacksPage from '../components/admin/AdminPacksPage.jsx';
import AdminScanStatsPage from '../components/admin/AdminScanStatsPage.jsx';
import AdminSettingsPage from '../components/admin/AdminSettingsPage.jsx';
import AdminUsersPage from '../components/admin/AdminUsersPage.jsx';
import { signOut } from '../lib/auth.js';
import { deleteAdminUser, fetchAdminDashboard, runAdminPaymentAction, runAdminUserAction } from '../lib/adminStats.js';
import { resendReceiptEmail } from '../lib/receipts.js';

export default function AdminPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('section') || 'overview';
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      setDashboard(await fetchAdminDashboard());
    } catch (loadError) {
      setDashboard(null);
      setError(loadError.message || 'Impossible de charger le dashboard admin.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await signOut();
    navigate('/', { replace: true });
  }

  function handleSectionChange(section) {
    setSearchParams({ section });
  }

  async function handleUserAction(user, action, body = {}) {
    setActionLoading(`${user.id}:${action}`);
    setError('');
    setMessage('');

    try {
      await runAdminUserAction(user.id, action, body);
      await loadDashboard();
    } catch (actionError) {
      setError(actionError.message || 'Action admin impossible.');
    } finally {
      setActionLoading('');
    }
  }

  async function handleDeleteUser(user, options = {}) {
    setActionLoading(`${user.id}:delete-user`);
    setError('');

    try {
      await deleteAdminUser(user.id, options);
      await loadDashboard();
    } catch (deleteError) {
      setError(deleteError.message || 'Suppression utilisateur impossible.');
    } finally {
      setActionLoading('');
    }
  }

  async function handlePaymentAction(payment, action) {
    setActionLoading(`${payment.id}:${action}`);
    setError('');
    setMessage('');

    try {
      const result = await runAdminPaymentAction(payment.id, action);
      if (result?.message) setMessage(result.message);
      await loadDashboard();
    } catch (paymentError) {
      setError(paymentError.message || 'Action paiement impossible.');
    } finally {
      setActionLoading('');
    }
  }

  async function handleReceiptAction(receipt, action) {
    setActionLoading(`${receipt.id}:${action}`);
    setError('');
    setMessage('');

    try {
      if (action === 'resend-email') {
        const result = await resendReceiptEmail(receipt.id);
        setMessage(result?.sent ? 'E-mail envoyé.' : 'E-mail non envoyé.');
      }
      await loadDashboard();
    } catch (receiptError) {
      setError(receiptError.message || 'Action reçu impossible.');
    } finally {
      setActionLoading('');
    }
  }

  const content = useMemo(() => {
    if (loading) return <LoadingState />;
    if (!dashboard) return null;

    switch (activeSection) {
      case 'users':
        return <AdminUsersPage users={dashboard.users} analyses={dashboard.analyses} actionLoading={actionLoading} onAction={handleUserAction} onDelete={handleDeleteUser} />;
      case 'analyses':
        return <AdminAnalysesPage analyses={dashboard.analyses} />;
      case 'scan-stats':
        return <AdminScanStatsPage dashboard={dashboard} />;
      case 'ai-usage':
        return <AdminAiUsagePage aiUsage={dashboard.aiUsage} />;
      case 'packs':
        return (
          <AdminPacksPage
            users={dashboard.users}
            subscriptions={dashboard.subscriptions}
            payments={dashboard.payments}
            receipts={dashboard.receipts}
            actionLoading={actionLoading}
            onAction={handleUserAction}
            onPaymentAction={handlePaymentAction}
            onReceiptAction={handleReceiptAction}
          />
        );
      case 'settings':
        return <AdminSettingsPage dashboard={dashboard} onSaved={loadDashboard} />;
      case 'overview':
      default:
        return <AdminOverviewPage dashboard={dashboard} />;
    }
  }, [activeSection, dashboard, loading, actionLoading]);

  return (
    <AdminLayout
      activeSection={activeSection}
      admin={dashboard?.admin}
      loading={loading}
      onSectionChange={handleSectionChange}
      onRefresh={loadDashboard}
      onLogout={handleLogout}
    >
      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}
      {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{message}</p> : null}
      {content}
    </AdminLayout>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-[1.25rem] border border-[#dfe8df] bg-white shadow-sm" />
      ))}
    </div>
  );
}
