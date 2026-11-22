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

export default function ImpactDashboardPage() {
  const [data, setData] = useState(null)

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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Impact Dashboard"
        description="The environmental and social difference rescued food is making. Sample data for the demo."
      />

      <div className="flex gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-900">
        <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>{IMPACT_ASSUMPTION}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <ImpactStatCard
          icon={Utensils}
          label="Total meals rescued"
          value={summary.mealsRescued}
          hint="Delivered, Meals unit only"
          tone="green"
        />
        <ImpactStatCard
          icon={Leaf}
          label="Food waste avoided"
          value={`${summary.wasteAvoidedKg} kg`}
          hint="Meals × 0.2 kg"
          tone="green"
        />
        <ImpactStatCard
          icon={CheckCircle2}
          label="Successful donations"
          value={summary.successfulDonations}
          hint="Donations with a delivered delivery"
          tone="green"
        />
        <ImpactStatCard
          icon={Truck}
          label="Completed deliveries"
          value={summary.completedDeliveries}
          hint="Delivered, all units"
          tone="stone"
        />
        <ImpactStatCard
          icon={Store}
          label="Active donors"
          value={summary.activeDonors}
          hint="Donors with an active donation"
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

      <p className="text-xs text-stone-500">
        Figures are illustrative demo data. Meals rescued count Meals-unit deliveries only; Kg and Packets are excluded. Waste avoided = meals × 0.2 kg per meal. Connect the impact service to live tables to replace them.
      </p>
    </div>
  )
}
