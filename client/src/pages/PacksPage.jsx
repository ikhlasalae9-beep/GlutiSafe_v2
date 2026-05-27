import { Check, CreditCard, Loader2, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentProfile } from '../lib/auth.js';
import { createManualPackRequest } from '../lib/payments.js';
import { PACKS, PAYMENT_METHODS, getCurrentPack } from '../lib/packs.js';

export default function PacksPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getCurrentProfile()
      .then((currentProfile) => {
        if (active) setProfile(currentProfile);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Impossible de charger votre pack.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const currentPack = useMemo(() => getCurrentPack(profile || {}), [profile]);

  const handlePaymentChoice = async (method) => {
    setMessage('');
    setError('');

    if (!selectedPack) return;

    if (method === 'paypal') {
      setMessage('PayPal sera bientôt disponible. Utilisez le paiement manuel pour le moment.');
      return;
    }

    if (method === 'cmi') {
      setMessage('Paiement par carte bancaire CMI: Bientôt disponible.');
      return;
    }

    try {
      setRequesting(true);
      await createManualPackRequest({ profile, packType: selectedPack.packType });
      setMessage('Votre demande de paiement manuel a été envoyée. Un administrateur va la vérifier.');
      setProfile(await getCurrentProfile());
      setSelectedPack(null);
    } catch (err) {
      setError(err.message || 'Impossible de créer la demande de paiement manuel.');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return <div className="page-shell page-section text-sm font-bold text-slate-600">Chargement des packs...</div>;
  }

  return (
    <div className="page-shell page-section">
      <header className="mb-8 rounded-[1.5rem] border border-[#dfe8df] bg-white p-6 shadow-sm">
        <p className="brand-kicker">Packs GlutiSafe</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1d252b]">Choisissez votre pack</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Commencez gratuitement, puis passez à un pack premium quand vous avez besoin de plus d'analyses.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">Pack actuel</p>
            <p className="mt-1 text-lg font-black text-[#1d252b]">{profile?.packDescription || currentPack.displayName}</p>
          </div>
        </div>
      </header>

      {error ? <Alert tone="red">{error}</Alert> : null}
      {message ? <Alert>{message}</Alert> : null}

      <section className="grid gap-5 lg:grid-cols-3">
        {PACKS.map((pack) => {
          const isCurrent =
            (profile?.packStatus === 'free' && pack.id === 'free') ||
            (profile?.packStatus === 'active' && currentPack.id === pack.id);
          return (
            <article
              key={pack.id}
              className={`relative flex min-h-[420px] flex-col rounded-[1.5rem] border bg-white p-6 shadow-sm ${
                pack.highlighted ? 'border-[#008f45] ring-4 ring-[#a8cfa5]/25' : 'border-[#dfe8df]'
              }`}
            >
              {pack.highlighted ? <span className="absolute right-5 top-5 rounded-full bg-[#008f45] px-3 py-1 text-xs font-black text-white">Meilleur choix</span> : null}
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f4e8] text-[#008f45]">
                <WalletCards className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="text-sm font-black uppercase tracking-[0.12em] text-[#008f45]">{pack.badge}</p>
              <h2 className="mt-2 text-2xl font-extrabold text-[#1d252b]">{pack.title}</h2>
              <p className="mt-4 text-4xl font-black text-[#1d252b]">
                {pack.price}
                {pack.cadence ? <span className="text-base font-bold text-slate-500"> {pack.cadence}</span> : null}
              </p>
              {pack.paypalAmount ? <p className="mt-2 text-xs font-bold text-slate-500">PayPal plus tard: {pack.paypalAmount}</p> : null}
              <ul className="mt-6 grid gap-3 text-sm font-semibold text-slate-700">
                {pack.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#008f45]" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                {pack.id === 'free' ? (
                  <Link
                    to="/analyse"
                    className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-black transition ${
                      isCurrent
                        ? 'border border-[#dfe8df] bg-[#f7f8f6] text-slate-600 hover:border-[#008f45] hover:text-[#008f45]'
                        : 'bg-[#008f45] text-white hover:bg-[#004b3a]'
                    }`}
                  >
                    {isCurrent ? 'Pack actuel' : 'Demander ce pack'}
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => setSelectedPack(pack)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#008f45] px-5 py-3 text-sm font-black text-white transition hover:bg-[#004b3a] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    {isCurrent ? 'Pack actuel' : 'Demander ce pack'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {selectedPack ? (
        <section className="mt-6 rounded-[1.5rem] border border-[#dfe8df] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="brand-kicker">Paiement</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#1d252b]">{selectedPack.displayName}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Le pack payant sera activé uniquement après confirmation du paiement.
              </p>
            </div>
            <button type="button" onClick={() => setSelectedPack(null)} className="text-sm font-black text-slate-500 hover:text-[#008f45]">
              Fermer
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                type="button"
                disabled={requesting}
                onClick={() => handlePaymentChoice(method.id)}
                className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4 text-left text-sm font-black text-[#1d252b] transition hover:border-[#008f45] hover:text-[#008f45] disabled:opacity-60"
              >
                <span className="flex items-center gap-2">
                  {requesting && method.id === 'manual' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CreditCard className="h-4 w-4" aria-hidden="true" />}
                  {method.label}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Alert({ children, tone = 'green' }) {
  const classes = tone === 'red' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800';
  return <p className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-bold ${classes}`}>{children}</p>;
}
