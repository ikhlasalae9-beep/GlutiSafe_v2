import { ShieldCheck, Server, ScanLine, UserRound } from 'lucide-react';
import AdminStatCard from './AdminStatCard.jsx';

export default function AdminSettingsPage({ dashboard }) {
  const settings = dashboard.settings;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon={Server} label="Supabase" value={settings.supabaseConfigured ? 'Connecté' : 'Non configuré'} tone={settings.supabaseConfigured ? 'green' : 'red'} />
        <AdminStatCard icon={ShieldCheck} label="Statut plateforme" value={settings.platformStatus} tone="green" />
        <AdminStatCard icon={ScanLine} label="Mode OCR" value={settings.ocrMode} />
        <AdminStatCard icon={UserRound} label="Admin" value={dashboard.admin?.name || dashboard.admin?.email || 'Admin'} />
      </section>

      <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-[#1d252b]">Environnement</h2>
        <div className="mt-4 grid gap-3">
          <Setting label="Supabase URL" value={settings.supabaseUrl || 'Non configuré'} />
          <Setting label="API URL" value={settings.apiUrl} />
          <Setting label="Rôle admin" value={dashboard.admin?.role || '-'} />
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-[#1d252b]">Disclaimer</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
          GlutiSafe aide à lire les ingrédients et à signaler les risques liés au gluten. L’application ne fournit pas de diagnostic médical et ne certifie pas qu’un produit est sans gluten.
        </p>
      </section>
    </div>
  );
}

function Setting({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-[#1d252b]">{value}</p>
    </div>
  );
}
