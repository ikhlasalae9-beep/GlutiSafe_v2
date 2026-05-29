import { Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { requestPasswordReset } from '../lib/auth.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccess('Un lien de réinitialisation a été envoyé si ce compte existe.');
    } catch (resetError) {
      setError(resetError.message || 'Impossible d’envoyer le lien.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-4 py-8 text-[#1d252b] sm:px-6">
      <section className="surface-card mx-auto mt-16 w-full max-w-md p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <img src="/logo.png" alt="Logo GlutiSafe" className="h-12 w-12 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[#dfe8df]" />
          <div>
            <p className="text-2xl font-extrabold tracking-tight">GlutiSafe</p>
            <p className="text-sm text-slate-500">Réinitialiser le mot de passe</p>
          </div>
        </div>
        <h1 className="text-3xl font-black text-[#1d252b]">Réinitialiser le mot de passe</h1>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Email</span>
            <span className="mt-2 flex items-center gap-3 rounded-2xl border border-[#dfe8df] bg-white px-4 py-3 focus-within:border-[#008f45] focus-within:ring-4 focus-within:ring-[#a8cfa5]/35">
              <Mail className="h-5 w-5 text-slate-400" aria-hidden="true" />
              <input className="w-full bg-transparent outline-none" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@example.com" />
            </span>
          </label>
          {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
          {success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{success}</p> : null}
          <Button className="w-full" type="submit" disabled={loading} icon={ShieldCheck}>
            {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link className="font-bold text-[#008f45] hover:text-[#004b3a]" to="/login">
            Retour à la connexion
          </Link>
        </p>
      </section>
    </main>
  );
}
