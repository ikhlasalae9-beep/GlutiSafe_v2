import { Mail, Save, ShieldCheck, SlidersHorizontal, UserRound, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminStatCard from './AdminStatCard.jsx';
import { PACKS, updatePackSettings, updatePaymentSettings } from '../../lib/packs.js';
import { sendAdminTestEmail } from '../../lib/receipts.js';

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
      const payload = parsePackForm(packForm);
      setPackForm(await updatePackSettings(payload));
      setMessage('Parametres des packs sauvegardes.');
      await onSaved?.();
    } catch (err) {
      setError(err.message || 'Sauvegarde impossible.');
    } finally {
      setSaving('');
    }
  }

  async function testEmailSending() {
    setSaving('email-test');
    setMessage('');
    setError('');
    try {
      const result = await sendAdminTestEmail(dashboard.admin?.email);
      setMessage(result.message || 'E-mail de test envoyé.');
    } catch (err) {
      setError(err.message || 'Test e-mail impossible.');
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
        <button type="button" disabled={saving === 'email-test'} onClick={testEmailSending} className="ml-3 mt-5 inline-flex items-center gap-2 rounded-2xl border border-[#dfe8df] bg-white px-5 py-3 text-sm font-black text-slate-700 hover:border-[#008f45] hover:text-[#008f45] disabled:opacity-60">
          <Mail className="h-4 w-4" aria-hidden="true" />
          Tester l'e-mail
        </button>
      </section>

      <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-5 w-5 text-[#008f45]" aria-hidden="true" />
          <h2 className="text-lg font-extrabold text-[#1d252b]">Parametres des packs</h2>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <PackBox title="Pack Gratuit" features={PACKS.find((pack) => pack.id === 'free')?.features}>
            <NumberField label="Tokens gratuits" value={packForm.free_tokens} onChange={(value) => setPackForm({ ...packForm, free_tokens: value })} />
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Reinitialisation</span>
              <select
                value={String(packForm.free_reset_hours || 24)}
                onChange={(event) => setPackForm({ ...packForm, free_reset_hours: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] px-4 py-3 text-sm font-bold outline-none"
              >
                <option value="5">5 heures</option>
                <option value="24">24 heures</option>
                <option value="168">7 jours</option>
              </select>
            </label>
          </PackBox>

          <PackBox title="Pack Mensuel" features={PACKS.find((pack) => pack.id === 'monthly')?.features}>
            <NumberField label="Prix mensuel MAD" value={packForm.monthly_price_mad} onChange={(value) => setPackForm({ ...packForm, monthly_price_mad: value })} />
            <NumberField label="Tokens mensuels" value={packForm.monthly_tokens} onChange={(value) => setPackForm({ ...packForm, monthly_tokens: value })} />
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Réinitialisation des tokens mensuels</span>
              <select
                value={String(packForm.monthly_reset_hours || 24)}
                onChange={(event) => setPackForm({ ...packForm, monthly_reset_hours: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] px-4 py-3 text-sm font-bold outline-none"
              >
                <option value="24">Chaque 24 heures</option>
                <option value="168">Chaque 7 jours</option>
              </select>
            </label>
            <NumberField label="Messages IA mensuels" value={packForm.monthly_ai_messages_limit ?? 100} onChange={(value) => setPackForm({ ...packForm, monthly_ai_messages_limit: value })} />
            <ReadOnly label="Duree" value="30 jours" />
          </PackBox>

          <PackBox title="Pack Annuel" features={PACKS.find((pack) => pack.id === 'yearly')?.features}>
            <NumberField label="Prix annuel MAD" value={packForm.yearly_price_mad} onChange={(value) => setPackForm({ ...packForm, yearly_price_mad: value })} />
            <NumberField label="Tokens annuels" value={packForm.yearly_tokens} onChange={(value) => setPackForm({ ...packForm, yearly_tokens: value })} />
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Réinitialisation des tokens annuels</span>
              <select
                value={String(packForm.yearly_reset_hours || 168)}
                onChange={(event) => setPackForm({ ...packForm, yearly_reset_hours: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] px-4 py-3 text-sm font-bold outline-none"
              >
                <option value="168">Chaque 7 jours</option>
                <option value="720">Chaque 30 jours</option>
              </select>
            </label>
            <NumberField label="Messages IA annuels" value={packForm.yearly_ai_messages_limit ?? 500} onChange={(value) => setPackForm({ ...packForm, yearly_ai_messages_limit: value })} />
            <ReadOnly label="Duree" value="365 jours" />
          </PackBox>
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
      <input type="number" min="0" className="field-control mt-2" value={value ?? 0} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function PackBox({ title, features = [], children }) {
  return (
    <section className="rounded-[1.25rem] border border-[#dfe8df] bg-[#f7f8f6] p-4">
      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#008f45]">{title}</h3>
      <div className="mt-4 grid gap-4">{children}</div>
      {features.length ? (
        <ul className="mt-4 grid gap-2 rounded-2xl border border-[#dfe8df] bg-white p-3 text-xs font-bold text-slate-700">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#008f45]" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ReadOnly({ label, value }) {
  return (
    <div>
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <p className="mt-2 rounded-2xl border border-[#dfe8df] bg-white px-4 py-3 text-sm font-black text-[#1d252b]">{value}</p>
    </div>
  );
}

function parsePackForm(form) {
  const payload = {
    free_tokens: Number(form.free_tokens),
    free_reset_hours: Number(form.free_reset_hours),
    monthly_tokens: Number(form.monthly_tokens),
    monthly_reset_hours: Number(form.monthly_reset_hours ?? 24),
    monthly_ai_messages_limit: Number(form.monthly_ai_messages_limit ?? 100),
    yearly_tokens: Number(form.yearly_tokens),
    yearly_reset_hours: Number(form.yearly_reset_hours ?? 168),
    yearly_ai_messages_limit: Number(form.yearly_ai_messages_limit ?? 500),
    monthly_price_mad: Number(form.monthly_price_mad),
    yearly_price_mad: Number(form.yearly_price_mad),
  };

  if (Object.values(payload).some((value) => Number.isNaN(value))) {
    throw new Error('Tous les champs des packs doivent etre numeriques.');
  }

  if (![5, 24, 168].includes(payload.free_reset_hours)) {
    throw new Error('La reinitialisation gratuite doit etre 5h, 24h ou 7 jours.');
  }

  if (![24, 168].includes(payload.monthly_reset_hours)) {
    throw new Error('La reinitialisation mensuelle doit etre 24h ou 7 jours.');
  }

  if (![168, 720].includes(payload.yearly_reset_hours)) {
    throw new Error('La reinitialisation annuelle doit etre 7 jours ou 30 jours.');
  }

  return payload;
}
