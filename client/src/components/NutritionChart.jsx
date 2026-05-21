import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const nutrition = [
  { name: 'Protein', value: 8, fill: '#14b8a6' },
  { name: 'Sugars', value: 18, fill: '#06b6d4' },
  { name: 'Fats', value: 11, fill: '#0f766e' },
];

export default function NutritionChart() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-700">Nutritional facts</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Macro overview</h2>
        </div>
        <div className="rounded-xl bg-cyan-50 px-4 py-3 text-right ring-1 ring-cyan-100">
          <p className="text-2xl font-black text-slate-950">248</p>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-700">Calories</p>
        </div>
      </div>

      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={nutrition} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#64748b" />
            <YAxis tickLine={false} axisLine={false} stroke="#64748b" />
            <Tooltip
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
              }}
              formatter={(value) => [`${value}g`, 'Amount']}
            />
            <Bar dataKey="value" radius={[12, 12, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {nutrition.map((item) => (
          <div key={item.name} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-700">{item.name}</p>
              <p className="font-black text-slate-950">{item.value}g</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full" style={{ width: `${Math.min(item.value * 4, 100)}%`, background: item.fill }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
