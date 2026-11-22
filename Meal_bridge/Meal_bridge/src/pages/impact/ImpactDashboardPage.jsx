import { useEffect, useState } from 'react'
import { Info, Utensils, Leaf, CheckCircle2, Store, Building2, Truck } from 'lucide-react'
import PageHeader from '../../components/dashboard/PageHeader'
import ImpactStatCard from '../../components/impact/ImpactStatCard'
import MealsRescuedChart from '../../components/impact/MealsRescuedChart'
import CategoryChart from '../../components/impact/CategoryChart'
import MonthlyWasteChart from '../../components/impact/MonthlyWasteChart'
import DonorContributionChart from '../../components/impact/DonorContributionChart'
import ImpactLists from '../../components/impact/ImpactLists'
import { getImpactData, IMPACT_ASSUMPTION } from '../../services/impactService'
import { IMPACT_CONFIG } from '../../lib/impactConfig.js'
import { computeImpact, filterByPeriod, isCompletedDelivery } from '../../lib/impactCalculations.js'

export default function ImpactDashboardPage() {
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('all')

  useEffect(() => {
    let active = true

    getImpactData().then((result) => {
      if (active) setData(result)
    })

    return () => {
      active = false
    }
  }, [])

  if (!data) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-600 shadow-sm">
        Loading impact data…
      </div>
    )
  }

  const { summary } = data
  const now = Date.now()
  const impact = computeImpact(data.deliveredListings || [], period, now)
  const delivered = filterByPeriod(
    (data.deliveredListings || []).filter(isCompletedDelivery),
    period,
    now,
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title="Impact Dashboard"
        description="The environmental and social difference rescued food is making."
      />

      <div className="flex gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-900">
        <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>{IMPACT_ASSUMPTION}</p>
      </div>

      <div>
        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
          Sample data
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="impact-period" className="text-sm font-semibold text-stone-700">Period</label>
        <select
          id="impact-period"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
        >
          <option value="week">This week (last 7 days)</option>
          <option value="month">This month (last 30 days)</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <ImpactStatCard
          icon={Utensils}
          label="Total meals rescued"
          value={Math.round(impact.meals)}
          hint={`Delivered listings, ${IMPACT_CONFIG.gramsPerMeal} g per meal`}
          tone="green"
        />
        <ImpactStatCard
          icon={Leaf}
          label="Food waste avoided"
          value={`${Math.round(impact.kgRescued * 10) / 10} kg`}
          hint={`${IMPACT_CONFIG.gramsPerMeal} g per meal`}
          tone="green"
        />
        <ImpactStatCard
          icon={Leaf}
          label="Estimated CO2e avoided"
          value={`${Math.round(impact.co2eKg * 10) / 10} kg`}
          hint={`${IMPACT_CONFIG.kgCo2ePerKgFood} kg CO2e per kg food`}
          tone="green"
        />
        <ImpactStatCard
          icon={CheckCircle2}
          label="Successful donations"
          value={new Set(delivered.map((item) => item.donationId)).size}
          hint="Donations with a delivered listing"
          tone="green"
        />
        <ImpactStatCard
          icon={Truck}
          label="Completed pickups"
          value={impact.completedPickups}
          hint="Delivered listings in this period"
          tone="stone"
        />
        <ImpactStatCard
          icon={Store}
          label="Active donors"
          value={impact.activeDonors}
          hint="Donors with a delivered listing in this period"
          tone="sky"
        />
        <ImpactStatCard
          icon={Building2}
          label="Participating NGOs"
          value={summary.participatingNgos}
          hint="Receivers with a delivered delivery"
          tone="amber"
        />
      </div>

      {impact.isEmpty ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <p className="font-semibold text-stone-800">No completed pickups yet</p>
          <p className="mt-2 text-sm text-stone-600">Post surplus food, then complete pickup and delivery to create impact.</p>
          <a href="/dashboard/donor/add" className="mt-4 inline-flex rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white">
            Post food
          </a>
        </div>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-700">
        <h2 className="font-semibold text-stone-900">How we calculate this</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{impact.formulas.kgRescued}</li>
          <li>{impact.formulas.meals}</li>
          <li>{impact.formulas.co2e}</li>
          <li>{impact.formulas.completedPickups}</li>
          <li>{impact.formulas.activeDonors}</li>
        </ul>
        <p className="mt-2 text-xs text-stone-500">
          {IMPACT_CONFIG.sourceNote} Last updated: {IMPACT_CONFIG.lastUpdated}.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <MealsRescuedChart data={data.mealsOverTime} />
        <CategoryChart data={data.categoryBreakdown} />
        <MonthlyWasteChart data={data.monthlyWaste} />
        <DonorContributionChart data={data.donorContributions} />
      </div>

      <ImpactLists
        recentDonations={data.recentSuccessfulDonations}
        topDonors={data.donorContributions}
        monthlyWaste={data.monthlyWaste}
      />
    </div>
  )
}
