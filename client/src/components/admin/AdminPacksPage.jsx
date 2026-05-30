import { Download, Mail, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { openReceiptPdf } from '../../lib/receipts.js';

const TABS = [
  { id: 'pending', label: 'Demandes en attente' },
  { id: 'active', label: 'Packs actifs' },
  { id: 'receipts', label: 'Recus' },
  { id: 'closed', label: 'Rejetees / expirees' },
];

export default function AdminPacksPage({ users, subscriptions, payments = [], receipts = [], actionLoading, onAction, onPaymentAction, onReceiptAction }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('pending');
  const query = search.trim().toLowerCase();

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesSearch = !query || `${user.name} ${user.email}`.toLowerCase().includes(query);
        const matchesTab = (tab === 'active' && user.packStatus === 'active') || (tab === 'closed' && user.packStatus === 'expired');
        return matchesSearch && matchesTab;
      }),
    [users, query, tab],
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const matchesSearch = !query || `${payment.userName} ${payment.userEmail} ${payment.userNote}`.toLowerCase().includes(query);
        const matchesTab = (tab === 'pending' && payment.status === 'pending') || (tab === 'closed' && payment.status === 'rejected');
        return matchesSearch && matchesTab;
      }),
    [payments, query, tab],
  );

  const filteredReceipts = useMemo(
    () => receipts.filter((receipt) => !query || `${receipt.receiptNumber} ${receipt.userName} ${receipt.userEmail} ${receipt.packLabel}`.toLowerCase().includes(query)),
    [receipts, query],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Free users" value={users.filter((user) => user.packStatus === 'free').length} />
        <Stat label="Pending requests" value={payments.filter((payment) => payment.status === 'pending').length} />
        <Stat label="Active monthly" value={users.filter((user) => user.packStatus === 'active' && user.packType === 'monthly').length} />
        <Stat label="Active yearly" value={users.filter((user) => user.packStatus === 'active' && user.packType === 'yearly' && isFutureDate(user.packEndAt)).length} />
        <Stat label="Expired users" value={users.filter((user) => user.packStatus === 'expired').length} />
      </section>

      <section className="admin-card p-5">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Navigation packs">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
                tab === item.id ? 'bg-[#008f45] text-white shadow-[0_12px_24px_rgba(0,143,69,0.18)]' : 'border border-[#dfe8df] bg-white text-slate-700 hover:border-[#008f45] hover:text-[#008f45]'
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
            className="w-full rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] py-3 pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-[#008f45] focus:ring-4 focus:ring-[#a8cfa5]/30"
            placeholder="Rechercher un utilisateur, une demande ou un recu"
          />
        </label>
      </section>

      {tab === 'pending' ? <PaymentRequests payments={filteredPayments} actionLoading={actionLoading} onPaymentAction={onPaymentAction} showActions /> : null}
      {tab === 'active' ? <UserPacks users={filteredUsers} actionLoading={actionLoading} onAction={onAction} /> : null}
      {tab === 'receipts' ? <ReceiptsSection receipts={filteredReceipts} actionLoading={actionLoading} onReceiptAction={onReceiptAction} /> : null}
      {tab === 'closed' ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <PaymentRequests payments={filteredPayments} actionLoading={actionLoading} onPaymentAction={onPaymentAction} />
          <UserPacks users={filteredUsers} actionLoading={actionLoading} onAction={onAction} title="Packs expires" />
        </div>
      ) : null}

      <section className="admin-card p-6">
        <h2 className="text-lg font-extrabold text-[#1d252b]">Historique abonnements</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">Derniers mouvements de packs et abonnements.</p>
        <div className="mt-5 grid gap-3">
          {subscriptions.length === 0 ? <Empty>Aucun historique d'abonnement disponible.</Empty> : null}
          {subscriptions.slice(0, 30).map((subscription) => (
            <div key={subscription.id} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-black text-[#1d252b]">{subscription.userName}</p>
                  <p className="truncate text-sm font-semibold text-slate-500">{subscription.userEmail}</p>
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

function PaymentRequests({ payments, actionLoading, onPaymentAction, showActions = false }) {
  return (
    <section className="admin-card p-6">
      <h2 className="text-lg font-extrabold text-[#1d252b]">{showActions ? 'Demandes en attente' : 'Demandes rejetees'}</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">Validation manuelle avec montant, methode et date visibles.</p>
      <div className="mt-5 grid gap-4">
        {payments.length === 0 ? <Empty>{showActions ? 'Aucune demande en attente.' : 'Aucune demande rejetee.'}</Empty> : null}
        {payments.map((payment) => (
          <article key={payment.id} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <p className="truncate font-black text-[#1d252b]">{payment.userName}</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-500">{payment.userEmail}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{payment.packLabel}</Badge>
                  <Badge>{payment.paymentMethod === 'cashplus' ? 'CashPlus' : 'RIB'}</Badge>
                  <Badge>{payment.amount ?? '-'} MAD</Badge>
                  <Badge>{formatDateTime(payment.createdAt)}</Badge>
                </div>
                {payment.userNote ? <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{payment.userNote}</p> : null}
              </div>
              {showActions ? (
                <div className="grid gap-2 sm:grid-cols-2 xl:min-w-64">
                  <Action primary disabled={actionLoading === `${payment.id}:confirm`} onClick={() => onPaymentAction(payment, 'confirm')}>
                    Confirmer
                  </Action>
                  <Action disabled={actionLoading === `${payment.id}:reject`} onClick={() => onPaymentAction(payment, 'reject')}>
                    Rejeter
                  </Action>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function UserPacks({ users, actionLoading, onAction, title = 'Packs actifs' }) {
  return (
    <section className="admin-card p-6">
      <h2 className="text-lg font-extrabold text-[#1d252b]">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">Actions rapides sur les packs utilisateurs.</p>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {users.map((user) => (
          <article key={user.id} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-extrabold text-[#1d252b]">{user.name}</h3>
                <p className="mt-1 truncate text-sm font-semibold text-slate-500">{user.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{user.packStatusLabel}</Badge>
                  <Badge>{user.packDisplayName}</Badge>
                  <Badge>Fin: {formatDate(user.packEndAt)}</Badge>
                </div>
              </div>
              <div className="grid gap-2 sm:min-w-44">
                <Action disabled={actionLoading === `${user.id}:expire-pack`} onClick={() => onAction(user, 'expire-pack')}>Expirer pack</Action>
                <Action disabled={actionLoading === `${user.id}:block`} onClick={() => onAction(user, 'block')}>Bloquer</Action>
                <Action disabled={actionLoading === `${user.id}:unblock`} onClick={() => onAction(user, 'unblock')}>Debloquer</Action>
              </div>
            </div>
          </article>
        ))}
        {users.length === 0 ? <Empty>Aucun utilisateur trouve.</Empty> : null}
      </div>
    </section>
  );
}

function ReceiptsSection({ receipts = [], actionLoading, onReceiptAction }) {
  return (
    <section className="admin-card p-6">
      <h2 className="text-lg font-extrabold text-[#1d252b]">Recus</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">Suivi PDF et statut e-mail des recus de paiement.</p>
      <div className="mt-5 grid gap-4">
        {receipts.length === 0 ? <Empty>Aucun recu disponible.</Empty> : null}
        {receipts.slice(0, 30).map((receipt) => (
          <article key={receipt.id} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <p className="truncate font-black text-[#1d252b]">{receipt.receiptNumber}</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-500">{receipt.userName} - {receipt.userEmail}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{receipt.packLabel}</Badge>
                  <Badge>{receipt.amount ?? '-'} {receipt.currency}</Badge>
                  <Badge>{formatDateTime(receipt.createdAt)}</Badge>
                  <Badge>{receipt.emailSent ? 'Email envoye' : 'Email non envoye'}</Badge>
                </div>
                {receipt.emailError ? <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{receipt.emailError}</p> : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:min-w-72">
                <Action disabled={!receipt.pdfPath} onClick={() => openReceiptPdf(receipt.pdfPath)} icon={Download}>Download PDF</Action>
                {!receipt.emailSent ? (
                  <Action disabled={actionLoading === `${receipt.id}:resend-email`} onClick={() => onReceiptAction?.(receipt, 'resend-email')} icon={Mail}>
                    Resend email
                  </Action>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="admin-card admin-card-hover min-h-[110px] p-5">
      <p className="text-3xl font-black text-[#1d252b]">{value}</p>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </div>
  );
}

function Action({ children, icon: Icon, primary = false, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition disabled:opacity-60 ${
        primary ? 'bg-[#008f45] text-white hover:bg-[#00753b]' : 'border border-[#dfe8df] bg-white text-slate-700 hover:border-[#008f45] hover:text-[#008f45]'
      }`}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

function Badge({ children }) {
  return <span className="inline-flex rounded-full border border-[#dfe8df] bg-white px-3 py-1 text-xs font-black text-slate-600">{children}</span>;
}

function Empty({ children }) {
  return <p className="rounded-2xl border border-dashed border-[#cbdccb] bg-white p-6 text-center text-sm font-bold text-slate-500">{children}</p>;
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
