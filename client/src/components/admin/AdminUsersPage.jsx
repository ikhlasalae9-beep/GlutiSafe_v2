import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import AdminUserModal from './AdminUserModal.jsx';

export default function AdminUsersPage({ users, analyses, actionLoading, onAction, onDelete }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [packFilter, setPackFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const scanCountByUser = useMemo(() => countScansByUser(analyses), [analyses]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !query || `${user.name} ${user.email}`.toLowerCase().includes(query);
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesPack = packFilter === 'all' || user.packStatus === packFilter;
      return matchesSearch && matchesRole && matchesPack;
    });
  }, [users, search, roleFilter, packFilter]);

  return (
    <div className="space-y-5">
      <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] py-3 pl-12 pr-4 text-sm font-semibold outline-none focus:border-[#008f45] focus:ring-4 focus:ring-[#a8cfa5]/30"
              placeholder="Rechercher par nom ou email"
            />
          </label>
          <Select value={roleFilter} onChange={setRoleFilter} options={['all', 'user', 'admin']} />
          <Select value={packFilter} onChange={setPackFilter} options={['all', 'free', 'active', 'expired', 'blocked']} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.25rem] border border-[#dfe8df] bg-white shadow-sm">
        <div className="border-b border-[#dfe8df] p-5">
          <h2 className="text-xl font-extrabold text-[#1d252b]">Gestion des utilisateurs</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{filteredUsers.length} utilisateur(s)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#f7f8f6] text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Nom</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Rôle</th>
                <th className="px-5 py-4">Pack</th>
                <th className="px-5 py-4">Fin du pack</th>
                <th className="px-5 py-4">Date inscription</th>
                <th className="px-5 py-4">Statut</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dfe8df]">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4 font-bold text-[#1d252b]">{user.name}</td>
                  <td className="px-5 py-4 text-slate-600">{user.email}</td>
                  <td className="px-5 py-4"><Badge>{user.role}</Badge></td>
                  <td className="px-5 py-4 text-slate-700">{user.packDisplayName}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(user.packEndAt)}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-4"><Badge tone={user.packStatus === 'blocked' ? 'red' : 'green'}>{user.packStatusLabel}</Badge></td>
                  <td className="px-5 py-4">
                    <button type="button" onClick={() => setSelectedUser(user)} className="rounded-2xl bg-[#008f45] px-4 py-2 text-sm font-black text-white hover:bg-[#004b3a]">
                      Gérer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] px-4 py-3 text-sm font-bold outline-none focus:border-[#008f45] focus:ring-4 focus:ring-[#a8cfa5]/30">
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

function Badge({ children, tone = 'default' }) {
  const toneClass = tone === 'red' ? 'border-red-200 bg-red-50 text-red-700' : tone === 'green' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-[#dfe8df] bg-white text-slate-600';
  return <span className={`rounded-full border px-3 py-1 text-xs font-black ${toneClass}`}>{children}</span>;
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
