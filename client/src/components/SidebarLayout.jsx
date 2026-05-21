import { History, Home, LogOut, ScanLine, UserRound } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearStoredUser, getStoredUser } from '../lib/auth.js';

const navItems = [
  { label: 'Home / Dashboard', path: '/', icon: Home },
  { label: "Scanner d'ingrédients", path: '/analyse', icon: ScanLine },
  { label: 'Historique des scans', path: '/history', icon: History },
  { label: 'Mon Profil', path: '/profile', icon: UserRound },
];

export default function SidebarLayout() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleSignOut = () => {
    clearStoredUser();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-50 hidden h-screen w-64 flex-col justify-between bg-slate-900 p-4 text-white shadow-2xl shadow-slate-950/30 lg:flex">
        <div>
          <NavLink to="/" className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-white/5">
            <img
              src="/logo.png"
              alt="GlutiSafe"
              className="h-12 w-12 rounded-2xl border border-cyan-300/30 bg-white object-contain p-1 shadow-lg shadow-cyan-950/40"
            />
            <div>
              <p className="text-xl font-black tracking-tight text-cyan-300">GlutiSafe</p>
              <p className="text-xs font-semibold text-slate-400">Safe label scanner</p>
            </div>
          </NavLink>

          <nav className="mt-8 space-y-2" aria-label="Primary navigation">
            {navItems.map((item) => (
              <SidebarLink key={item.path} item={item} />
            ))}
          </nav>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-400 text-white shadow-lg shadow-cyan-950/30">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{user?.name || 'Guest User'}</p>
              <p className="truncate text-xs text-slate-400">{user?.email || 'Not signed in'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm font-bold text-slate-200 transition hover:border-red-300/40 hover:bg-red-500/10 hover:text-red-200 focus:outline-none focus:ring-4 focus:ring-cyan-400/20"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
        <div className="flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="GlutiSafe" className="h-10 w-10 rounded-xl bg-white object-contain" />
            <span className="text-lg font-black text-slate-950">GlutiSafe</span>
          </NavLink>
          <button type="button" onClick={handleSignOut} className="rounded-xl bg-slate-100 p-2 text-slate-600">
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav className="mt-3 grid grid-cols-4 gap-2" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex min-h-11 items-center justify-center rounded-xl text-xs font-bold transition ${
                  isActive ? 'bg-cyan-50 text-teal-700 ring-1 ring-cyan-100' : 'bg-slate-50 text-slate-500'
                }`
              }
              aria-label={item.label}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:pl-72 lg:pr-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}

function SidebarLink({ item }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
          isActive
            ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {item.label}
    </NavLink>
  );
}
