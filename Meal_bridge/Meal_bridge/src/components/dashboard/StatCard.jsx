export default function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-600">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-primary-800">{value}</p>
        </div>
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
      {hint && <p className="mt-3 text-xs text-stone-500">{hint}</p>}
    </div>
  )
}
