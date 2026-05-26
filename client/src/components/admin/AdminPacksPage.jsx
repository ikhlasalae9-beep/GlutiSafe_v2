import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

const PACK_FILTERS = ['all', 'free', 'pending', 'active', 'expired', 'blocked'];

export default function AdminPacksPage({ users, subscriptions, actionLoading, onAction }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !query || `${user.name} ${user.email}`.toLowerCase().includes(query);
      const matchesStatus = status === 'all' || user.packStatus === status;
      return matchesSearch && matchesStatus;
    });
  }, [users, search, status]);

  return (
    <div className="space-y-5">
      <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] py-3 pl-12 pr-4 text-sm font-semibold outline-none focus:border-[#008f45] focus:ring-4 focus:ring-[#a8cfa5]/30" placeholder="Rechercher un utilisateur" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] px-4 py-3 text-sm font-bold outline-none">
            {PACK_FILTERS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {filteredUsers.map((user) => (
          <article key={user.id} className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#1d252b]">{user.name}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{user.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{user.packStatus}</Badge>
                  <Badge>{user.packType}</Badge>
                  <Badge>Fin: {formatDate(user.packEndAt)}</Badge>
                </div>
              </div>
              <div className="grid gap-2 sm:min-w-44">
                <Action disabled={actionLoading === `${user.id}:activate-pack`} onClick={() => onAction(user, 'activate-pack', { pack_type: 'monthly' })}>Activer mensuel</Action>
                <Action disabled={actionLoading === `${user.id}:activate-pack`} onClick={() => onAction(user, 'activate-pack', { pack_type: 'yearly' })}>Activer annuel</Action>
                <Action disabled={actionLoading === `${user.id}:expire-pack`} onClick={() => onAction(user, 'expire-pack')}>Expirer pack</Action>
              </div>
            </div>
          </article>
        ))}
      </section>
      {filteredUsers.length === 0 ? <p className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-8 text-center text-sm font-bold text-slate-500">Aucun utilisateur trouvé.</p> : null}

      <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-[#1d252b]">Historique abonnements</h2>
        <div className="mt-4 grid gap-3">
          {subscriptions.length === 0 ? <p className="text-sm font-bold text-slate-500">Aucun historique d’abonnement disponible.</p> : null}
          {subscriptions.slice(0, 30).map((subscription) => (
            <div key={subscription.id} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black text-[#1d252b]">{subscription.userName}</p>
                  <p className="text-sm font-semibold text-slate-500">{subscription.userEmail}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{subscription.packName}</Badge>
                  <Badge>{subscription.status}</Badge>
                  <Badge>{formatDate(subscription.endDate)}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Action({ children, ...props }) {
  return <button type="button" className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] px-4 py-2 text-sm font-black text-slate-700 hover:border-[#008f45] hover:text-[#008f45] disabled:opacity-60" {...props}>{children}</button>;
}

function Badge({ children }) {
  return <span className="rounded-full border border-[#dfe8df] bg-[#f7f8f6] px-3 py-1 text-xs font-black text-slate-600">{children}</span>;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}
