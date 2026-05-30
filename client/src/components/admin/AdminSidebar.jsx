import { BarChart3, BrainCircuit, LayoutDashboard, ListChecks, ScanLine, Settings, UsersRound, WalletCards } from 'lucide-react';

export const adminSections = [
  { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: 'users', label: 'Utilisateurs', icon: UsersRound },
  { id: 'analyses', label: 'Analyses', icon: ListChecks },
  { id: 'scan-stats', label: 'Statistiques scans', icon: BarChart3 },
  { id: 'ai-usage', label: 'Explications', icon: BrainCircuit },
  { id: 'packs', label: 'Packs', icon: WalletCards },
  { id: 'settings', label: 'Parametres', icon: Settings },
];

export default function AdminSidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 shrink-0 border-r border-[#dfe8df] bg-white/95 px-4 py-5 shadow-[16px_0_50px_rgba(29,37,43,0.04)] backdrop-blur lg:block">
      <div className="flex items-center gap-3 rounded-[1.25rem] border border-[#dfe8df] bg-[#f7fbf7] px-3 py-3">
        <img src="/logo.png" alt="Logo GlutiSafe" className="h-12 w-12 shrink-0 rounded-2xl object-contain ring-1 ring-[#dfe8df]" />
        <div className="min-w-0">
          <p className="truncate text-lg font-black text-[#1d252b]">GlutiSafe</p>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#008f45]">Admin</p>
        </div>
      </div>

      <nav className="mt-8 space-y-1" aria-label="Navigation admin">
        {adminSections.map((item) => (
          <AdminNavButton key={item.id} item={item} active={activeSection === item.id} onClick={() => onSectionChange(item.id)} />
        ))}
      </nav>
    </aside>
  );
}

export function AdminMobileNav({ activeSection, onSectionChange }) {
  return (
    <div className="sticky top-[5.25rem] z-20 lg:hidden">
      <label className="block">
        <span className="sr-only">Section admin</span>
        <select
          value={activeSection}
          onChange={(event) => onSectionChange(event.target.value)}
          className="w-full rounded-2xl border border-[#dfe8df] bg-white px-4 py-3 text-sm font-bold text-[#1d252b] shadow-sm outline-none transition focus:border-[#008f45] focus:ring-4 focus:ring-[#a8cfa5]/30"
        >
          {adminSections.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function AdminNavButton({ item, active, onClick }) {
  const Icon = item.icon || ScanLine;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition duration-200 ${
        active
          ? 'bg-[#008f45] text-white shadow-[0_14px_30px_rgba(0,143,69,0.2)]'
          : 'text-slate-600 hover:translate-x-1 hover:bg-[#f2f8f2] hover:text-[#008f45]'
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${active ? 'bg-white/20' : 'bg-white text-[#008f45] group-hover:bg-[#e8f4e8]'}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 truncate">{item.label}</span>
    </button>
  );
}
