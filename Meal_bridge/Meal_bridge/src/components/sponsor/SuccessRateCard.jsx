export default function SuccessRateCard({ percent, successful, total }) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)))

  return (
    <div className="card rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
        <div
          role="img"
          aria-label={`Donation success rate ${clamped} percent`}
          className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(#15803d ${clamped * 3.6}deg, #e7e5e4 0deg)` }}
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white">
            <span className="font-display text-3xl text-stone-900 tabular-nums">{`${clamped}%`}</span>
          </div>
        </div>

        <div className="mt-4 sm:mt-0">
          <h3 className="font-display text-lg text-stone-900">Donation success rate</h3>
          <p className="mt-1 text-sm text-stone-600">Successful donations out of all donations posted</p>
          <p className="mt-3 text-sm text-stone-600">{`${successful} of ${total} donations succeeded`}</p>
        </div>
      </div>
    </div>
  )
}
