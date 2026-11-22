import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function DonorContributionChart({ data }) {
  const chartData = (data || []).slice(0, 6);

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="font-display text-lg text-stone-900">Donor contribution comparison</h3>
      <p className="mt-1 text-sm text-stone-500">Delivered meals by donor</p>

      {chartData.length === 0 ? (
        <p className="mt-6 text-sm text-stone-500">No donor contributions yet. Charts will appear once meals are delivered.</p>
      ) : (
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="meals" name="Meals delivered" fill="#15803d" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
