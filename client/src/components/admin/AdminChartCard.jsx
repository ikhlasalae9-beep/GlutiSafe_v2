export default function AdminChartCard({ title, subtitle, children }) {
  return (
    <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-extrabold text-[#1d252b]">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
