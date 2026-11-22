const TONE_CLASSES = {
  green: 'bg-primary-50 text-primary-700',
  amber: 'bg-amber-50 text-amber-700',
  sky: 'bg-sky-50 text-sky-700',
  stone: 'bg-stone-100 text-stone-700',
}

export default function ImpactStatCard({ icon: Icon, label, value, hint, tone = 'green' }) {
  const toneClass = TONE_CLASSES[tone] ?? TONE_CLASSES.green

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
        {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
      </span>
      <p className="mt-4 font-display text-3xl font-semibold tabular-nums text-stone-900 sm:text-4xl">
        {value}
      </p>
      <p className="mt-2 text-sm font-medium text-stone-600">{label}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  )
}
