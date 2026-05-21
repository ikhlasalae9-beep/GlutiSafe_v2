export default function FeatureCard({ icon: Icon, title, children }) {
  return (
    <article className="glass-card rounded-2xl p-6">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Icon size={22} />
      </div>
      <h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{children}</p>
    </article>
  );
}
