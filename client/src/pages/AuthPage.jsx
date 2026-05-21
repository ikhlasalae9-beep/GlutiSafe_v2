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
      name: isRegister ? name.trim() : isSameStoredUser ? storedUser.name : normalizedEmail.split('@')[0] || 'Guest User',
      email: normalizedEmail,
    };

    setStoredUser(nextUser);
    navigate('/profile');
  };

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.28),transparent_30%),radial-gradient(circle_at_86%_12%,rgba(34,211,238,0.2),transparent_28%),linear-gradient(135deg,#0f172a,#083344)]" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
        <section className="hidden text-white lg:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-cyan-200" aria-hidden="true" />
            Trusted food decisions
          </span>
          <h1 className="mt-8 max-w-xl text-5xl font-black leading-tight tracking-tight">
            Your calm companion for gluten-aware living.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-cyan-50/80">
            Create your account to save product checks, review nutritional patterns, and keep dietary preferences close.
          </p>
          <div className="mt-10 grid max-w-xl grid-cols-2 gap-4">
            {[
              { icon: Leaf, label: 'Ingredient clarity' },
              { icon: HeartPulse, label: 'Health-aware support' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <item.icon className="h-7 w-7 text-cyan-200" aria-hidden="true" />
                <p className="mt-4 font-bold">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-xl border border-white/70 bg-white/95 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-2xl font-black tracking-tight">GlutiSafe</p>
              <p className="text-sm text-slate-500">{isRegister ? 'Create your account' : 'Welcome back'}</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isRegister ? (
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Name</span>
                <Field
                  icon={UserRound}
                  placeholder="Your full name"
                  required
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
            ) : null}
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Email</span>
              <Field
                icon={Mail}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Password</span>
              <Field
                icon={Lock}
                placeholder="Enter your password"
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <Button className="w-full" type="submit">{isRegister ? 'Create Account' : 'Sign In'}</Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
            <Link className="font-bold text-teal-700 hover:text-teal-600" to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Sign in here' : 'Create one here'}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function Field({ icon: Icon, ...props }) {
  return (
    <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-cyan-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-100">
      <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />
      <input className="w-full bg-transparent text-slate-950 outline-none placeholder:text-slate-400" {...props} />
    </span>
  );
}
