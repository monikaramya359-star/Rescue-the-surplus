import { Award, CheckCircle2 } from 'lucide-react'
import { formatDateTime, formatQuantity } from '../../lib/formatters'
import { formatMonthLabel } from '../../lib/impactCalculations'

const CARD_CLASS = 'rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6'
const EMPTY_CLASS = 'text-sm text-stone-600'

export default function ImpactLists({ recentDonations = [], topDonors = [], monthlyWaste = [] }) {
  const recent = recentDonations.slice(0, 5)
  const top = topDonors.slice(0, 5)
  const months = monthlyWaste.slice(-6).reverse()

  const totalMeals = monthlyWaste.reduce((sum, row) => sum + (Number(row.meals) || 0), 0)
  const totalWasteKg =
    Math.round(monthlyWaste.reduce((sum, row) => sum + (Number(row.wasteKg) || 0), 0) * 10) / 10

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className={`${CARD_CLASS} lg:col-span-1`}>
        <h2 className="font-display text-lg font-semibold text-stone-900">
          Recent successful donations
        </h2>
        {recent.length === 0 ? (
          <p className={`mt-4 ${EMPTY_CLASS}`}>No completed deliveries yet.</p>
        ) : (
          <ol className="mt-4 space-y-4">
            {recent.map((donation) => (
              <li key={donation.id} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-medium text-stone-900">{donation.donorName}</p>
                  <p className="text-sm text-stone-600">
                    {donation.category} · {formatQuantity(donation.quantity, donation.unit)}
                  </p>
                  <p className="text-xs text-stone-500">{formatDateTime(donation.completedAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className={CARD_CLASS}>
        <h2 className="font-display text-lg font-semibold text-stone-900">
          Top contributing donors
        </h2>
        {top.length === 0 ? (
          <p className={`mt-4 ${EMPTY_CLASS}`}>No donor contributions yet.</p>
        ) : (
          <ol className="mt-4 space-y-4">
            {top.map((donor, index) => (
              <li key={donor.donorId} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-stone-900">{donor.name}</p>
                  <p className="text-sm text-stone-600">{donor.deliveries} deliveries</p>
                </div>
                <p className="shrink-0 text-sm text-stone-500">{donor.meals} meals</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className={CARD_CLASS}>
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary-700" aria-hidden="true" />
          <h2 className="font-display text-lg font-semibold text-stone-900">
            Monthly impact summary
          </h2>
        </div>
        {months.length === 0 ? (
          <p className={`mt-4 ${EMPTY_CLASS}`}>No monthly impact data yet.</p>
        ) : (
          <>
            <div className="mt-4">
              <div className="grid grid-cols-3 gap-2 pb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
                <span>Month</span>
                <span className="text-right">Meals</span>
                <span className="text-right">Waste avoided</span>
              </div>
              <div className="divide-y divide-stone-200">
                {months.map((row) => (
                  <div key={row.month} className="grid grid-cols-3 gap-2 py-3 text-sm">
                    <span className="text-stone-900">{formatMonthLabel(row.month)}</span>
                    <span className="text-right text-stone-700">{row.meals}</span>
                    <span className="text-right text-stone-700">{row.wasteKg} kg</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 border-t border-stone-200 pt-4 text-sm font-medium text-stone-900">
              Totals: {totalMeals} meals · {totalWasteKg} kg avoided
            </p>
          </>
        )}
      </section>
    </div>
  )
}
