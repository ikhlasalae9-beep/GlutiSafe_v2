import { HeartPulse, Leaf, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';

export default function LoginPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.28),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(34,211,238,0.22),transparent_30%),linear-gradient(135deg,#0f172a,#083344)]" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="hidden text-white lg:block">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-cyan-200" aria-hidden="true" />
              Trusted ingredient guidance
            </span>
            <h1 className="mt-8 text-5xl font-black leading-tight tracking-tight">
              Feel confident before the first bite.
            </h1>
            <p className="mt-5 text-lg leading-8 text-cyan-50/80">
              GlutiSafe helps you review ingredient labels with a calm, clear experience built for everyday food choices.
            </p>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-2 gap-4">
            {[
              { icon: Leaf, label: 'Food-first design' },
              { icon: HeartPulse, label: 'Health-aware checks' },
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
              <p className="text-sm text-slate-500">Welcome back</p>
            </div>
          </div>

          <form className="space-y-5">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Email</span>
              <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-cyan-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-100">
                <Mail className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <input
                  className="w-full bg-transparent text-slate-950 outline-none placeholder:text-slate-400"
                  type="email"
                  placeholder="you@example.com"
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">Password</span>
              <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-cyan-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-100">
                <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <input
                  className="w-full bg-transparent text-slate-950 outline-none placeholder:text-slate-400"
                  type="password"
                  placeholder="Enter your password"
                />
              </span>
            </label>

            <Link to="/" className="block">
              <Button className="w-full">Sign In</Button>
            </Link>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New to GlutiSafe?{' '}
            <a className="font-bold text-teal-700 hover:text-teal-600" href="#create-account">
              Create Account
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
