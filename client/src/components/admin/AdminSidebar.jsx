import { BarChart3, BrainCircuit, LayoutDashboard, ListChecks, ScanLine, Settings, UsersRound, WalletCards } from 'lucide-react';

export const adminSections = [
  { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: 'users', label: 'Utilisateurs', icon: UsersRound },
  { id: 'analyses', label: 'Analyses', icon: ListChecks },
  { id: 'scan-stats', label: 'Statistiques scans', icon: BarChart3 },
  { id: 'ai-usage', label: 'Utilisation IA', icon: BrainCircuit },
  { id: 'packs', label: 'Packs', icon: WalletCards },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

export default function AdminSidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-[#dfe8df] bg-white px-4 py-5 lg:block">
      <div className="flex items-center gap-3 px-2">
        <img src="/logo.png" alt="Logo GlutiSafe" className="h-12 w-12 rounded-2xl object-contain ring-1 ring-[#dfe8df]" />
        <div>
          <p className="text-lg font-black text-[#1d252b]">GlutiSafe</p>
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
    <div className="lg:hidden">
      <label className="block">
        <span className="sr-only">Section admin</span>
        <select
          value={activeSection}
          onChange={(event) => onSectionChange(event.target.value)}
          className="w-full rounded-2xl border border-[#dfe8df] bg-white px-4 py-3 text-sm font-bold text-[#1d252b] shadow-sm outline-none focus:border-[#008f45] focus:ring-4 focus:ring-[#a8cfa5]/30"
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
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
        active ? 'bg-[#008f45] text-white shadow-[0_14px_30px_rgba(0,143,69,0.2)]' : 'text-slate-600 hover:bg-[#f7f8f6] hover:text-[#008f45]'
      }`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {item.label}
    </button>
  );
}
