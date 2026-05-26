import { LogOut, RefreshCw } from 'lucide-react';
import Button from '../Button.jsx';
import { adminSections } from './AdminSidebar.jsx';

export default function AdminTopbar({ activeSection, admin, loading, onRefresh, onLogout }) {
  const section = adminSections.find((item) => item.id === activeSection);

  return (
    <header className="sticky top-0 z-30 border-b border-[#dfe8df] bg-[#f7f8f6]/90 px-4 py-4 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="brand-kicker">Administration</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1d252b]">{section?.label || 'Dashboard Admin'}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-2xl border border-[#dfe8df] bg-white px-4 py-2 shadow-sm">
            <p className="text-xs font-bold text-slate-500">Admin</p>
            <p className="max-w-[220px] truncate text-sm font-black text-[#1d252b]">{admin?.name || admin?.email || 'Admin'}</p>
          </div>
          <Button variant="secondary" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Actualiser
          </Button>
          <Button variant="secondary" onClick={onLogout}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  );
}
