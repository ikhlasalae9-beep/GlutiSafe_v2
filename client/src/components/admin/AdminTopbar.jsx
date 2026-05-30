import { LogOut, RefreshCw } from 'lucide-react';
import Button from '../Button.jsx';
import { adminSections } from './AdminSidebar.jsx';

export default function AdminTopbar({ activeSection, admin, loading, onRefresh, onLogout }) {
  const section = adminSections.find((item) => item.id === activeSection);
  const adminName = admin?.name || admin?.email || 'Admin';

  return (
    <header className="sticky top-0 z-30 border-b border-[#dfe8df] bg-[#f5f8f5]/88 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[92rem] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="brand-kicker">Administration</p>
          <h1 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-[#1d252b] sm:text-3xl">{section?.label || 'Dashboard Admin'}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 rounded-2xl border border-[#dfe8df] bg-white px-4 py-2 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Admin</p>
            <p className="max-w-[15rem] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-black text-[#1d252b]" title={adminName}>
              {adminName}
            </p>
          </div>
          <Button variant="secondary" onClick={onRefresh} disabled={loading} className="group shrink-0">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : 'transition group-hover:rotate-45'}`} aria-hidden="true" />
            Actualiser
          </Button>
          <Button variant="secondary" onClick={onLogout} className="shrink-0">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Deconnexion
          </Button>
        </div>
      </div>
    </header>
  );
}
