import { Activity, BarChart3, CalendarClock, ScanLine } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AdminChartCard from './AdminChartCard.jsx';
import AdminStatCard from './AdminStatCard.jsx';

const COLORS = ['#008f45', '#dc2626', '#d97706', '#64748b', '#004b3a'];

export default function AdminScanStatsPage({ dashboard }) {
  const stats = dashboard.scanStats;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon={ScanLine} label="Total scans" value={dashboard.scansCount} />
        <AdminStatCard icon={Activity} label="Moyenne scans / utilisateur" value={stats.averageScansPerUser.toFixed(1)} />
        <AdminStatCard icon={BarChart3} label="Résultat le plus fréquent" value={stats.mostCommonResult} />
        <AdminStatCard icon={CalendarClock} label="Dernier scan" value={formatDate(stats.lastScanDate)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AdminChartCard title="Scans par statut">
          <ChartBox>
            <PieChart>
              <Pie data={stats.scansByStatus} dataKey="count" nameKey="status" innerRadius={62} outerRadius={96}>
                {stats.scansByStatus.map((item, index) => <Cell key={item.status} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ChartBox>
        </AdminChartCard>

        <AdminChartCard title="Scans par jour">
          <ChartBox>
            <BarChart data={stats.scansPerDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#008f45" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartBox>
        </AdminChartCard>

        <AdminChartCard title="Top mots gluten détectés">
          <ChartBox>
            <BarChart data={stats.topDetectedWords} layout="vertical" margin={{ left: 70 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="word" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="count" fill="#dc2626" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ChartBox>
        </AdminChartCard>

        <AdminChartCard title="Activité des scans">
          <ChartBox>
            <LineChart data={stats.scansPerDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#004b3a" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ChartBox>
        </AdminChartCard>
      </section>
    </div>
  );
}

function ChartBox({ children }) {
  return <div className="h-80"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}
