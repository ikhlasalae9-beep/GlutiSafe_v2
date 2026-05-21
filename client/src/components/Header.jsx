import { History, LogOut, ScanLine, ShieldCheck, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import Button from './Button.jsx';

export default function Header() {
  const linkClass = ({ isActive }) =>
    `rounded-xl px-3 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-cyan-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-lg font-black tracking-tight text-slate-950">GlutiSafe</p>
            <p className="hidden text-xs font-medium text-slate-500 sm:block">Ingredient confidence</p>
          </div>
        </NavLink>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          <NavLink to="/" className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/analyse" className={linkClass}>
            Analyse
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            History
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            Profile
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <NavLink to="/analyse" className="md:hidden">
            <Button variant="secondary" className="h-11 w-11 px-0" aria-label="Analyse" icon={ScanLine} />
          </NavLink>
          <NavLink to="/history" className="md:hidden">
            <Button variant="secondary" className="h-11 w-11 px-0" aria-label="History" icon={History} />
          </NavLink>
          <NavLink to="/profile" className="md:hidden">
            <Button variant="secondary" className="h-11 w-11 px-0" aria-label="Profile" icon={UserRound} />
          </NavLink>
          <NavLink to="/login">
            <Button variant="ghost" icon={LogOut} className="px-3 sm:px-4">
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </NavLink>
        </div>
      </div>
    </header>
  );
}
