import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import Button from '../Button.jsx';

export default function AdminUserModal({ user, scanCount = 0, actionLoading = '', onClose, onAction, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteAnalyses, setDeleteAnalyses] = useState(false);

  if (!user) return null;

  const isBusy = actionLoading.startsWith(`${user.id}:`);

  return (
    <div className="fixed inset-0 z-50 bg-[#1d252b]/35 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[#dfe8df] p-5">
          <div>
            <p className="brand-kicker">Utilisateur</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[#1d252b]">{user.name}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{user.email}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl border border-[#dfe8df] text-slate-500 hover:bg-[#f7f8f6]">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Rôle" value={user.role} />
            <Detail label="Statut pack" value={user.packStatusLabel} />
            <Detail label="Type pack" value={user.packDisplayName} />
            <Detail label="Fin du pack" value={formatDate(user.packEndAt)} />
            <Detail label="Scans" value={scanCount} />
            <Detail label="Inscription" value={formatDate(user.createdAt)} />
          </div>

          <section className="mt-6 rounded-[1.25rem] border border-[#dfe8df] bg-[#f7f8f6] p-4">
            <h3 className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">Actions</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Action disabled={isBusy} onClick={() => onAction(user, 'expire-pack')}>
                Expirer le pack
              </Action>
              <Action disabled={isBusy} onClick={() => onAction(user, 'block')}>
                Bloquer utilisateur
              </Action>
              <Action disabled={isBusy} onClick={() => onAction(user, 'unblock')}>
                Débloquer utilisateur
              </Action>
              {user.role !== 'admin' ? (
                <Action disabled={isBusy} onClick={() => onAction(user, 'make-admin')}>
                  Rendre admin
                </Action>
              ) : null}
            </div>
          </section>

          <section className="mt-6 rounded-[1.25rem] border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
              <div>
                <h3 className="font-black text-red-800">Supprimer utilisateur</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-red-700">Cette action est irréversible.</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-red-700">
                  La suppression complète du compte passe par une action sécurisée réservée aux administrateurs.
                </p>
              </div>
            </div>

            {confirmDelete ? (
              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-red-800">
                  <input type="checkbox" checked={deleteAnalyses} onChange={(event) => setDeleteAnalyses(event.target.checked)} />
                  Supprimer aussi les analyses liées
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={isBusy}>
                    Annuler
                  </Button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onDelete(user, { deleteAnalyses })}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-700 px-5 py-3 text-sm font-black text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Confirmer la suppression
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mt-4 rounded-2xl bg-red-700 px-5 py-3 text-sm font-black text-white transition hover:bg-red-800"
              >
                Supprimer utilisateur
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#dfe8df] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-[#1d252b]">{value || '-'}</p>
    </div>
  );
}

function Action({ children, ...props }) {
  return (
    <button
      type="button"
      className="rounded-2xl border border-[#dfe8df] bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[#008f45] hover:text-[#008f45] disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {children}
    </button>
  );
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}
