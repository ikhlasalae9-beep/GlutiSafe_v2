import AdminSidebar, { AdminMobileNav } from './AdminSidebar.jsx';
import AdminTopbar from './AdminTopbar.jsx';

export default function AdminLayout({ activeSection, admin, loading, onSectionChange, onRefresh, onLogout, children }) {
  return (
    <main className="min-h-screen bg-[#f7f8f6] text-[#1d252b]">
      <div className="flex min-h-screen">
        <AdminSidebar activeSection={activeSection} onSectionChange={onSectionChange} />
        <div className="min-w-0 flex-1">
          <AdminTopbar activeSection={activeSection} admin={admin} loading={loading} onRefresh={onRefresh} onLogout={onLogout} />
          <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6">
            <AdminMobileNav activeSection={activeSection} onSectionChange={onSectionChange} />
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
