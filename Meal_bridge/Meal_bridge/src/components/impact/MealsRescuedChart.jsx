import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatMonthLabel } from '../../lib/impactCalculations';

export default function MealsRescuedChart({ data }) {
  const chartData = data.map(({ month, meals }) => ({
    label: formatMonthLabel(month),
    meals,
  }));

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-lg text-stone-900">Meals rescued over time</h2>
      <p className="text-sm text-stone-600">Successfully delivered meals per month</p>

      {chartData.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-stone-600">
          No deliveries yet
        </div>
      ) : (
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#57534e' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#57534e' }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="meals"
                stroke="#15803d"
                fill="#22c55e"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
