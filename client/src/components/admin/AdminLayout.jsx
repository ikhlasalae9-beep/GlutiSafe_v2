import AdminSidebar, { AdminMobileNav } from './AdminSidebar.jsx';
import AdminTopbar from './AdminTopbar.jsx';

export default function AdminLayout({ activeSection, admin, loading, onSectionChange, onRefresh, onLogout, children }) {
  return (
    <main className="min-h-screen bg-[#f5f8f5] text-[#1d252b]">
      <div className="flex min-h-screen">
        <AdminSidebar activeSection={activeSection} onSectionChange={onSectionChange} />
        <div className="min-w-0 flex-1 lg:pl-72">
          <AdminTopbar activeSection={activeSection} admin={admin} loading={loading} onRefresh={onRefresh} onLogout={onLogout} />
          <div className="admin-page-enter mx-auto w-full max-w-[92rem] space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <AdminMobileNav activeSection={activeSection} onSectionChange={onSectionChange} />
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
