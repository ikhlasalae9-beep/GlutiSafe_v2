import { Eye, Search, ShieldBan, Trash2, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';
import AdminUserModal from './AdminUserModal.jsx';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free' },
  { id: 'pending', label: 'Pending' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'expired', label: 'Expired' },
  { id: 'blocked', label: 'Blocked' },
];

export default function AdminUsersPage({ users, analyses, actionLoading, onAction, onDelete }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const scanCountByUser = useMemo(() => countScansByUser(analyses), [analyses]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !query || `${user.name} ${user.email}`.toLowerCase().includes(query);
      const matchesFilter =
        filter === 'all' ||
        user.packStatus === filter ||
        (filter === 'monthly' && user.packStatus === 'active' && user.packType === 'monthly') ||
        (filter === 'yearly' && user.packStatus === 'active' && user.packType === 'yearly') ||
        (filter === 'pending' && user.packStatus === 'pending');
      return matchesSearch && matchesFilter;
    });
  }, [users, search, filter]);

  return (
    <div className="space-y-6">
      <section className="admin-card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] py-3 pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-[#008f45] focus:ring-4 focus:ring-[#a8cfa5]/30"
              placeholder="Rechercher par nom ou email"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0" aria-label="Filtres utilisateurs">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
                  filter === item.id ? 'bg-[#008f45] text-white shadow-[0_12px_24px_rgba(0,143,69,0.18)]' : 'border border-[#dfe8df] bg-white text-slate-600 hover:border-[#008f45] hover:text-[#008f45]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="border-b border-[#dfe8df] p-6">
          <h2 className="text-xl font-extrabold text-[#1d252b]">Gestion des utilisateurs</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{filteredUsers.length} utilisateur(s)</p>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-[#f7f8f6] text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Pack</th>
                <th className="px-6 py-4">Fin du pack</th>
                <th className="px-6 py-4">Date inscription</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dfe8df]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="transition hover:bg-[#f7fbf7]">
                  <td className="px-6 py-4">
                    <p className="max-w-[14rem] truncate font-black text-[#1d252b]">{user.name}</p>
                    <p className="mt-1 max-w-[18rem] truncate text-sm font-semibold text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-6 py-4"><Badge>{user.role}</Badge></td>
                  <td className="px-6 py-4 font-bold text-slate-700">{user.packDisplayName}</td>
                  <td className="px-6 py-4 text-slate-600">{formatDate(user.packEndAt)}</td>
                  <td className="px-6 py-4 text-slate-600">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4"><Badge tone={user.packStatus === 'blocked' ? 'red' : 'green'}>{user.packStatusLabel}</Badge></td>
                  <td className="px-6 py-4">
                    <ActionGroup user={user} actionLoading={actionLoading} onView={() => setSelectedUser(user)} onAction={onAction} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-4 lg:hidden">
          {filteredUsers.map((user) => (
            <article key={user.id} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
              <div className="min-w-0">
                <p className="truncate font-black text-[#1d252b]">{user.name}</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-500">{user.email}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{user.role}</Badge>
                <Badge>{user.packDisplayName}</Badge>
                <Badge tone={user.packStatus === 'blocked' ? 'red' : 'green'}>{user.packStatusLabel}</Badge>
              </div>
              <p className="mt-3 text-xs font-bold text-slate-500">Fin: {formatDate(user.packEndAt)} - Scans: {scanCountByUser.get(user.id) || 0}</p>
              <div className="mt-4">
                <ActionGroup user={user} actionLoading={actionLoading} onView={() => setSelectedUser(user)} onAction={onAction} />
              </div>
            </article>
          ))}
        </div>

        {filteredUsers.length === 0 ? <EmptyState text="Aucun utilisateur ne correspond aux filtres." /> : null}
      </section>

      <AdminUserModal
        user={selectedUser}
        scanCount={selectedUser ? scanCountByUser.get(selectedUser.id) || 0 : 0}
        actionLoading={actionLoading}
        onClose={() => setSelectedUser(null)}
        onAction={onAction}
        onDelete={onDelete}
      />
    </div>
  );
}

function ActionGroup({ user, actionLoading, onView, onAction }) {
  const isBlocked = user.packStatus === 'blocked';

  return (
    <div className="flex flex-wrap gap-2">
      <SmallAction onClick={onView} icon={Eye}>View</SmallAction>
      <SmallAction onClick={onView} icon={WalletCards}>Change pack</SmallAction>
      <SmallAction disabled={actionLoading === `${user.id}:${isBlocked ? 'unblock' : 'block'}`} onClick={() => onAction(user, isBlocked ? 'unblock' : 'block')} icon={ShieldBan}>
        {isBlocked ? 'Unblock' : 'Block'}
      </SmallAction>
      <SmallAction disabled={actionLoading === `${user.id}:delete-user`} onClick={onView} icon={Trash2} danger>
        Delete
      </SmallAction>
    </div>
  );
}

function SmallAction({ children, icon: Icon, danger = false, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition disabled:opacity-60 ${
        danger ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' : 'border-[#dfe8df] bg-white text-slate-700 hover:border-[#008f45] hover:text-[#008f45]'
      }`}
      {...props}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

function Badge({ children, tone = 'default' }) {
  const toneClass = tone === 'red' ? 'border-red-200 bg-red-50 text-red-700' : tone === 'green' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-[#dfe8df] bg-white text-slate-600';
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${toneClass}`}>{children}</span>;
}

function EmptyState({ text }) {
  return <p className="p-8 text-center text-sm font-bold text-slate-500">{text}</p>;
}

function countScansByUser(analyses) {
  return analyses.reduce((map, analysis) => map.set(analysis.userId, (map.get(analysis.userId) || 0) + 1), new Map());
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}
