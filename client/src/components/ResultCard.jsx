import { AlertTriangle, Bot, CheckCircle2, Sparkles } from 'lucide-react';

const statusStyles = {
  danger: {
    label: 'Gluten Detected',
    icon: AlertTriangle,
    badge: 'bg-red-50 text-red-700 ring-red-200',
    panel: 'border-red-200 bg-red-50/70',
    dot: 'bg-red-500',
  },
  safe: {
    label: 'Safe',
    icon: CheckCircle2,
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    panel: 'border-emerald-200 bg-emerald-50/70',
    dot: 'bg-emerald-500',
  },
};

export default function ResultCard({
  status = 'danger',
  ingredients = ['Wheat', 'Malt'],
  explanation = 'Attention! This product contains wheat and malt, two ingredients commonly associated with gluten. Please choose another option or confirm with the product manufacturer before consuming.',
}) {
  const style = statusStyles[status];
  const StatusIcon = style.icon;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Scan result</p>
          <div className="mt-2 flex items-center gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${style.badge}`}>
              <StatusIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-black text-slate-950">{style.label}</h2>
              <p className="text-sm text-slate-500">Review the highlighted ingredients below.</p>
            </div>
          </div>
        </div>

        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ring-1 ${style.badge}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden="true" />
          {style.label}
        </span>
      </div>

      <div className="mt-6">
        <p className="text-sm font-bold text-slate-700">Detected ingredients</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ingredients.map((ingredient) => (
            <span
              key={ingredient}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
            >
              {ingredient}
            </span>
          ))}
        </div>
      </div>

      <div className={`mt-6 rounded-xl border p-4 ${style.panel}`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-black text-slate-950">Our AI Assistant</p>
              <Sparkles className="h-4 w-4 text-cyan-500" aria-hidden="true" />
            </div>
            <p className="mt-1 leading-7 text-slate-700">{explanation}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
