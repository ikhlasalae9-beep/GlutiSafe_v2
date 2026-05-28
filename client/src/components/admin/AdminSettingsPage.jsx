import { Save, ShieldCheck, SlidersHorizontal, UserRound, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminStatCard from './AdminStatCard.jsx';
import { updatePackSettings, updatePaymentSettings } from '../../lib/packs.js';

export default function AdminSettingsPage({ dashboard, onSaved }) {
  const settings = dashboard.settings;
  const [paymentForm, setPaymentForm] = useState(dashboard.paymentSettings || {});
  const [packForm, setPackForm] = useState(dashboard.packSettings || {});
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setPaymentForm(dashboard.paymentSettings || {});
    setPackForm(dashboard.packSettings || {});
  }, [dashboard.paymentSettings, dashboard.packSettings]);

  async function savePaymentSettings() {
    setSaving('payment');
    setMessage('');
    setError('');
    try {
      setPaymentForm(await updatePaymentSettings(paymentForm));
      setMessage('Parametres de paiement sauvegardes.');
      await onSaved?.();
    } catch (err) {
      setError(err.message || 'Sauvegarde impossible.');
    } finally {
      setSaving('');
    }
  }

  async function savePackSettings() {
    setSaving('pack');
    setMessage('');
    setError('');
    try {
      setPackForm(await updatePackSettings(packForm));
      setMessage('Parametres des packs sauvegardes.');
      await onSaved?.();
    } catch (err) {
      setError(err.message || 'Sauvegarde impossible.');
    } finally {
      setSaving('');
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon={ShieldCheck} label="Supabase" value={settings.supabaseConfigured ? 'Connecte' : 'Non configure'} tone={settings.supabaseConfigured ? 'green' : 'red'} />
        <AdminStatCard icon={ShieldCheck} label="Statut plateforme" value={settings.platformStatus} tone="green" />
        <AdminStatCard icon={WalletCards} label="Paiements" value="Manuels" />
        <AdminStatCard icon={UserRound} label="Admin" value={dashboard.admin?.name || dashboard.admin?.email || 'Admin'} />
      </section>

      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}
      {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{message}</p> : null}

      <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <WalletCards className="h-5 w-5 text-[#008f45]" aria-hidden="true" />
          <h2 className="text-lg font-extrabold text-[#1d252b]">Parametres de paiement</h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Titulaire RIB" value={paymentForm.rib_holder} onChange={(value) => setPaymentForm({ ...paymentForm, rib_holder: value })} />
          <Field label="Banque" value={paymentForm.bank_name} onChange={(value) => setPaymentForm({ ...paymentForm, bank_name: value })} />
          <Field label="Numero RIB" value={paymentForm.rib_number} onChange={(value) => setPaymentForm({ ...paymentForm, rib_number: value })} />
          <Field label="Nom complet CashPlus" value={paymentForm.cashplus_full_name} onChange={(value) => setPaymentForm({ ...paymentForm, cashplus_full_name: value })} />
          <Field label="Telephone CashPlus" value={paymentForm.cashplus_phone} onChange={(value) => setPaymentForm({ ...paymentForm, cashplus_phone: value })} />
          <Field label="Ville CashPlus" value={paymentForm.cashplus_city} onChange={(value) => setPaymentForm({ ...paymentForm, cashplus_city: value })} />
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-bold text-slate-700">Note de paiement</span>
          <textarea
            value={paymentForm.payment_note || ''}
            onChange={(event) => setPaymentForm({ ...paymentForm, payment_note: event.target.value })}
            className="mt-2 min-h-28 w-full rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4 text-sm font-semibold outline-none focus:border-[#008f45] focus:ring-4 focus:ring-[#a8cfa5]/30"
          />
        </label>
        <button type="button" disabled={saving === 'payment'} onClick={savePaymentSettings} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#008f45] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
          <Save className="h-4 w-4" aria-hidden="true" />
          Enregistrer
        </button>
      </section>

      <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-5 w-5 text-[#008f45]" aria-hidden="true" />
          <h2 className="text-lg font-extrabold text-[#1d252b]">Parametres des packs</h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <NumberField label="Tokens gratuits" value={packForm.free_tokens} onChange={(value) => setPackForm({ ...packForm, free_tokens: value })} />
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Reinitialisation gratuite</span>
            <select
              value={packForm.free_reset_hours || 24}
              onChange={(event) => setPackForm({ ...packForm, free_reset_hours: Number(event.target.value) })}
              className="mt-2 w-full rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] px-4 py-3 text-sm font-bold outline-none"
            >
              <option value={5}>5 heures</option>
              <option value={24}>24 heures</option>
              <option value={168}>7 jours</option>
            </select>
          </label>
          <NumberField label="Tokens mensuels" value={packForm.monthly_tokens} onChange={(value) => setPackForm({ ...packForm, monthly_tokens: value })} />
          <NumberField label="Tokens annuels" value={packForm.yearly_tokens} onChange={(value) => setPackForm({ ...packForm, yearly_tokens: value })} />
          <NumberField label="Prix mensuel MAD" value={packForm.monthly_price_mad} onChange={(value) => setPackForm({ ...packForm, monthly_price_mad: value })} />
          <NumberField label="Prix annuel MAD" value={packForm.yearly_price_mad} onChange={(value) => setPackForm({ ...packForm, yearly_price_mad: value })} />
        </div>
        <button type="button" disabled={saving === 'pack'} onClick={savePackSettings} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#008f45] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
          <Save className="h-4 w-4" aria-hidden="true" />
          Enregistrer
        </button>
      </section>
    </div>
  );
}

function Field({ label, value = '', onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input className="field-control mt-2" value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({ label, value = 0, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input type="number" min="0" className="field-control mt-2" value={value ?? 0} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
