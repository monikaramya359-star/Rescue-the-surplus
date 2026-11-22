import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function CategoryChart({ data }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-lg text-stone-900">Food donations by category</h2>
      <p className="text-sm text-stone-600">Number of donations per food type</p>

      {data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-stone-600">
          No donations yet
        </div>
      ) : (
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart layout="vertical" data={data} margin={{ left: 8 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="category"
                width={110}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#16a34a" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
