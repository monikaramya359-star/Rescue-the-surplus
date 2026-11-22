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
import { formatMonthLabel } from '../../lib/impactCalculations';

export default function MonthlyWasteChart({ data }) {
  const chartData = (data || []).map((row) => ({
    label: formatMonthLabel(row.month),
    wasteKg: row.wasteKg,
    meals: row.meals,
  }));

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="font-display text-lg text-stone-900">Monthly food waste avoided</h3>
      <p className="mt-1 text-sm text-stone-500">Estimated kg, from delivered meals × 0.2 kg</p>

      {chartData.length === 0 ? (
        <p className="mt-6 text-sm text-stone-500">No completed deliveries yet, so there is no monthly waste data to show.</p>
      ) : (
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} label={{ value: 'kg', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value} kg`} />
              <Legend />
              <Bar dataKey="wasteKg" name="Waste avoided (kg)" fill="#16a34a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
