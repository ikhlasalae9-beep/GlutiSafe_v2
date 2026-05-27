import { History, Home, LogOut, Menu, ScanLine, UserRound, WalletCards, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, signOut } from '../lib/auth.js';

const navItems = [
  { label: 'Accueil', path: '/', icon: Home },
  { label: 'Analyser', path: '/analyse', icon: ScanLine },
  { label: 'Historique', path: '/history', icon: History },
  { label: 'Packs', path: '/packs', icon: WalletCards },
  { label: 'Profil', path: '/profile', icon: UserRound },
];

export default function SidebarLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isLanding = location.pathname === '/';

  useEffect(() => {
    let active = true;
    getCurrentUser().then((currentUser) => {
      if (active) setUser(currentUser);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="app-shell">
      {isLanding ? (
        <LandingHeader menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      ) : (
      <header className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-white/70 bg-white/78 px-3 py-3 shadow-[0_20px_60px_rgba(29,37,43,0.12)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <NavLink
              to="/"
              onClick={() => setMenuOpen(false)}
              className="flex shrink-0 items-center justify-center transition focus:outline-none focus:ring-4 focus:ring-[#a8cfa5]/35"
              aria-label="Accueil GlutiSafe"
            >
              <img
                src="/logo.png"
                alt="Logo GlutiSafe"
                className="h-[60px] w-[60px] object-contain sm:h-[72px] sm:w-[72px] lg:h-[92px] lg:w-[92px]"
              />
            </NavLink>

            <nav className="hidden items-center gap-1 rounded-full border border-[#dfe8df] bg-[#f7f8f6]/72 p-1 lg:flex" aria-label="Navigation principale">
            {navItems.map((item) => (
                <HeaderLink key={item.path} item={item} />
            ))}
          </nav>

            <div className="hidden items-center gap-2 lg:flex">
              <div className="flex max-w-[210px] items-center gap-3 rounded-2xl border border-[#dfe8df] bg-white/75 px-3 py-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f4e8] text-[#008f45]">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#1d252b]">{user?.name}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dfe8df] bg-white text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
                aria-label="Déconnexion"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dfe8df] bg-white text-[#1d252b] transition hover:text-[#008f45] focus:outline-none focus:ring-4 focus:ring-[#a8cfa5]/35 lg:hidden"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>

          {menuOpen ? (
            <div className="mt-3 border-t border-[#dfe8df] pt-3 lg:hidden">
              <nav className="grid grid-cols-2 gap-2" aria-label="Navigation mobile">
                {navItems.map((item) => (
                  <HeaderLink key={item.path} item={item} compact onNavigate={() => setMenuOpen(false)} />
                ))}
              </nav>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[#f7f8f6]/80 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#1d252b]">{user?.name}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                </div>
                <button type="button" onClick={handleSignOut} className="secondary-btn px-3" aria-label="Déconnexion">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </header>
      )}

      <main className={isLanding ? 'min-h-screen pt-20 sm:pt-24' : 'min-h-screen pt-28 sm:pt-32'}>
        <Outlet />
      </main>
    </div>
  );
}

function LandingHeader({ menuOpen, setMenuOpen }) {
  const navLinks = [
    ['Accueil', '#accueil'],
    ['Comment ça marche', '#comment-ca-marche'],
    ['Fonctionnalités', '#fonctionnalites'],
    ['Packs', '#packs'],
    ['Questions', '#questions'],
    ['Scanner', '#scanner'],
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="landing-header">
      <div className="landing-header__inner">
        <a href="#accueil" className="landing-header__brand" onClick={closeMenu} aria-label="Accueil GlutiSafe">
          <img src="/assets/landing/logo.png" alt="Logo GlutiSafe" />
        </a>

        <nav className="landing-header__nav" aria-label="Navigation landing page">
          {navLinks.map(([label, href]) =>
            href.startsWith('#') ? (
              <a key={href} href={href}>
                {label}
              </a>
            ) : (
              <Link key={href} to={href}>
                {label}
              </Link>
            ),
          )}
        </nav>

        <div className="landing-header__actions">
          <Link to="/analyse" className="landing-header__cta">
            Commencer
          </Link>
          <button
            type="button"
            className="landing-header__menu"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="landing-header__mobile">
          <nav aria-label="Navigation mobile landing page">
            {navLinks.map(([label, href]) =>
              href.startsWith('#') ? (
                <a key={href} href={href} onClick={closeMenu}>
                  {label}
                </a>
              ) : (
                <Link key={href} to={href} onClick={closeMenu}>
                  {label}
                </Link>
              ),
            )}
            <Link to="/analyse" className="landing-header__mobile-cta" onClick={closeMenu}>
              Commencer
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function HeaderLink({ item, compact = false, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-[#a8cfa5]/35 ${
          compact ? 'min-h-12 rounded-2xl' : ''
        } ${
          isActive ? 'bg-[#008f45] text-white shadow-[0_12px_28px_rgba(0,143,69,0.22)]' : 'text-slate-600 hover:bg-white hover:text-[#008f45]'
        }`
      }
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {item.label}
    </NavLink>
  );
}
