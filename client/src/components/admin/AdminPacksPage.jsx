import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { openReceiptPdf } from '../../lib/receipts.js';

const TABS = [
  { id: 'pending', label: 'Demandes en attente' },
  { id: 'active', label: 'Packs actifs' },
  { id: 'free', label: 'Utilisateurs Free' },
  { id: 'expired', label: 'Packs expires' },
  { id: 'rejected', label: 'Demandes rejetees' },
];

export default function AdminPacksPage({ users, subscriptions, payments = [], receipts = [], actionLoading, onAction, onPaymentAction, onReceiptAction }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('pending');

  const query = search.trim().toLowerCase();
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesSearch = !query || `${user.name} ${user.email}`.toLowerCase().includes(query);
        const matchesTab =
          (tab === 'active' && user.packStatus === 'active') ||
          (tab === 'free' && user.packStatus === 'free') ||
          (tab === 'expired' && user.packStatus === 'expired');
        return matchesSearch && matchesTab;
      }),
    [users, query, tab],
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const matchesSearch = !query || `${payment.userName} ${payment.userEmail} ${payment.userNote}`.toLowerCase().includes(query);
        const matchesTab = (tab === 'pending' && payment.status === 'pending') || (tab === 'rejected' && payment.status === 'rejected');
        return matchesSearch && matchesTab;
      }),
    [payments, query, tab],
  );

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Free users" value={users.filter((user) => user.packStatus === 'free').length} />
        <Stat label="Pending requests" value={payments.filter((payment) => payment.status === 'pending').length} />
        <Stat label="Active monthly" value={users.filter((user) => user.packStatus === 'active' && user.packType === 'monthly').length} />
        <Stat label="Active yearly" value={users.filter((user) => user.packStatus === 'active' && user.packType === 'yearly' && isFutureDate(user.packEndAt)).length} />
        <Stat label="Expired users" value={users.filter((user) => user.packStatus === 'expired').length} />
      </section>

      <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                tab === item.id ? 'bg-[#008f45] text-white' : 'border border-[#dfe8df] bg-[#f7f8f6] text-slate-700 hover:border-[#008f45] hover:text-[#008f45]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="relative mt-4 block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] py-3 pl-12 pr-4 text-sm font-semibold outline-none focus:border-[#008f45] focus:ring-4 focus:ring-[#a8cfa5]/30"
            placeholder="Rechercher un utilisateur ou une demande"
          />
        </label>
      </section>

      {tab === 'pending' || tab === 'rejected' ? (
        <PaymentRequests payments={filteredPayments} actionLoading={actionLoading} onPaymentAction={onPaymentAction} showActions={tab === 'pending'} />
      ) : (
        <UserPacks users={filteredUsers} actionLoading={actionLoading} onAction={onAction} />
      )}

      <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-[#1d252b]">Historique abonnements</h2>
        <div className="mt-4 grid gap-3">
          {subscriptions.length === 0 ? <p className="text-sm font-bold text-slate-500">Aucun historique d'abonnement disponible.</p> : null}
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

      <ReceiptsSection receipts={receipts} actionLoading={actionLoading} onReceiptAction={onReceiptAction} />
    </div>
  );
}

function PaymentRequests({ payments, actionLoading, onPaymentAction, showActions }) {
  return (
    <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-extrabold text-[#1d252b]">{showActions ? 'Demandes en attente' : 'Demandes rejetees'}</h2>
      <div className="mt-4 grid gap-3">
        {payments.length === 0 ? <p className="text-sm font-bold text-slate-500">{showActions ? 'Aucune demande en attente.' : 'Aucune demande rejetee.'}</p> : null}
        {payments.map((payment) => (
          <div key={payment.id} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-black text-[#1d252b]">{payment.userName}</p>
                <p className="text-sm font-semibold text-slate-500">{payment.userEmail}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{payment.packLabel}</Badge>
                  <Badge>{payment.paymentMethod === 'cashplus' ? 'CashPlus' : 'RIB'}</Badge>
                  <Badge>{payment.amount ?? '-'} MAD</Badge>
                  <Badge>{payment.status}</Badge>
                  <Badge>{formatDateTime(payment.createdAt)}</Badge>
                </div>
                <p className="mt-2 text-xs font-bold text-slate-500">Pack: {payment.packType} - Methode: {payment.paymentMethod}</p>
                {payment.userNote ? <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{payment.userNote}</p> : null}
              </div>
              {showActions ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:min-w-72">
                  <Action disabled={actionLoading === `${payment.id}:confirm`} onClick={() => onPaymentAction(payment, 'confirm')}>
                    Confirmer paiement
                  </Action>
                  <Action disabled={actionLoading === `${payment.id}:reject`} onClick={() => onPaymentAction(payment, 'reject')}>
                    Rejeter demande
                  </Action>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function UserPacks({ users, actionLoading, onAction }) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {users.map((user) => (
        <article key={user.id} className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#1d252b]">{user.name}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{user.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{user.packStatusLabel}</Badge>
                <Badge>{user.packDisplayName}</Badge>
                <Badge>Fin: {formatDate(user.packEndAt)}</Badge>
              </div>
            </div>
            <div className="grid gap-2 sm:min-w-44">
              <Action disabled={actionLoading === `${user.id}:expire-pack`} onClick={() => onAction(user, 'expire-pack')}>
                Expirer pack
              </Action>
              <Action disabled={actionLoading === `${user.id}:block`} onClick={() => onAction(user, 'block')}>
                Bloquer
              </Action>
              <Action disabled={actionLoading === `${user.id}:unblock`} onClick={() => onAction(user, 'unblock')}>
                Debloquer
              </Action>
            </div>
          </div>
        </article>
      ))}
      {users.length === 0 ? <p className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-8 text-center text-sm font-bold text-slate-500">Aucun utilisateur trouve.</p> : null}
    </section>
  );
}

function ReceiptsSection({ receipts = [], actionLoading, onReceiptAction }) {
  return (
    <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-extrabold text-[#1d252b]">Reçus récents</h2>
      <div className="mt-4 grid gap-3">
        {receipts.length === 0 ? <p className="text-sm font-bold text-slate-500">Aucun reçu disponible.</p> : null}
        {receipts.slice(0, 20).map((receipt) => (
          <div key={receipt.id} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-black text-[#1d252b]">{receipt.receiptNumber}</p>
                <p className="text-sm font-semibold text-slate-500">{receipt.userName} - {receipt.userEmail}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{receipt.packLabel}</Badge>
                  <Badge>{receipt.amount ?? '-'} {receipt.currency}</Badge>
                  <Badge>{formatDateTime(receipt.createdAt)}</Badge>
                  <Badge>{receipt.emailSent ? 'Email envoyé' : 'Email non envoyé'}</Badge>
                </div>
                {receipt.emailError ? <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{receipt.emailError}</p> : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:min-w-72">
                <Action disabled={!receipt.pdfPath} onClick={() => openReceiptPdf(receipt.pdfPath)}>
                  Download PDF
                </Action>
                {!receipt.emailSent ? (
                  <Action disabled={actionLoading === `${receipt.id}:resend-email`} onClick={() => onReceiptAction?.(receipt, 'resend-email')}>
                    Renvoyer l'e-mail
                  </Action>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
      <p className="text-2xl font-black text-[#1d252b]">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </div>
  );
}

function Action({ children, ...props }) {
  return (
    <button
      type="button"
      className="rounded-2xl border border-[#dfe8df] bg-white px-4 py-2 text-sm font-black text-slate-700 hover:border-[#008f45] hover:text-[#008f45] disabled:opacity-60"
      {...props}
    >
      {children}
    </button>
  );
}

function Badge({ children }) {
  return <span className="rounded-full border border-[#dfe8df] bg-white px-3 py-1 text-xs font-black text-slate-600">{children}</span>;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function isFutureDate(value) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}
