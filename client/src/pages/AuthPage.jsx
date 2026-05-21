import { HeartPulse, Leaf, Lock, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { getStoredUser, setStoredUser } from '../lib/auth.js';

export default function AuthPage({ mode = 'register' }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    const storedUser = getStoredUser() || {};
    const normalizedEmail = email.trim().toLowerCase();
    const isSameStoredUser = storedUser.email === normalizedEmail;

    const nextUser = {
      name: isRegister ? name.trim() : isSameStoredUser ? storedUser.name : normalizedEmail.split('@')[0] || 'Invité',
      email: normalizedEmail,
    };

    setStoredUser(nextUser);
    navigate('/profile');
  };

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-4 py-6 text-[#1d252b] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="organic-panel hidden rounded-[2rem] bg-[#004b3a] p-10 text-white shadow-2xl lg:block">
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-[#a8cfa5]" aria-hidden="true" />
              Safe Gluten-Free Dining
            </span>
            <h1 className="mt-8 max-w-xl text-5xl font-extrabold leading-tight tracking-tight">
              Une plateforme claire pour vérifier vos étiquettes.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/78">
              Créez un profil local pour conserver vos analyses sur cet appareil et retrouver vos résultats plus vite.
            </p>
            <div className="mt-10 grid max-w-xl grid-cols-2 gap-4">
              <Feature icon={Leaf} label="Ingrédients plus lisibles" />
              <Feature icon={HeartPulse} label="Expérience rassurante" />
            </div>
          </div>
        </section>

        <section className="surface-card mx-auto w-full max-w-md p-6 sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <img src="/logo.png" alt="Logo GlutiSafe" className="h-12 w-12 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[#dfe8df]" />
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-[#1d252b]">GlutiSafe</p>
              <p className="text-sm text-slate-500">{isRegister ? 'Créer votre profil' : 'Bon retour'}</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isRegister ? (
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Nom</span>
                <Field icon={UserRound} placeholder="Votre nom" required type="text" value={name} onChange={(event) => setName(event.target.value)} />
              </label>
            ) : null}
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Email</span>
              <Field icon={Mail} placeholder="vous@example.com" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Mot de passe</span>
              <Field icon={Lock} placeholder="Votre mot de passe" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <p className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] px-4 py-3 text-xs leading-5 text-slate-500">
              Profil local de démonstration. Les données sont conservées dans ce navigateur.
            </p>
            <Button className="w-full" type="submit">{isRegister ? 'Créer le profil' : 'Se connecter'}</Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isRegister ? 'Déjà un profil ?' : 'Besoin de créer un profil ?'}{' '}
            <Link className="font-bold text-[#008f45] hover:text-[#004b3a]" to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Se connecter' : 'Créer un profil'}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function Field({ icon: Icon, ...props }) {
  return (
    <span className="mt-2 flex items-center gap-3 rounded-2xl border border-[#dfe8df] bg-white px-4 py-3 focus-within:border-[#008f45] focus-within:ring-4 focus-within:ring-[#a8cfa5]/35">
      <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />
      <input className="w-full bg-transparent text-[#1d252b] outline-none placeholder:text-slate-400" {...props} />
    </span>
  );
}

function Feature({ icon: Icon, label }) {
  return (
    <div className="rounded-[1.25rem] border border-white/15 bg-white/10 p-5">
      <Icon className="h-7 w-7 text-[#a8cfa5]" aria-hidden="true" />
      <p className="mt-4 font-bold">{label}</p>
    </div>
  );
}
