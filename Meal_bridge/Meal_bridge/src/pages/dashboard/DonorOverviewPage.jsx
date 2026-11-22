import { CheckCircle2, ClipboardList, Clock, Plus, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatCard from '../../components/dashboard/StatCard.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'

import FoodImage from '../../components/ui/FoodImage.jsx'
import { useDonor } from '../../context/DonorContext.jsx'
import { formatQuantity } from '../../lib/formatters.js'

export default function DonorOverviewPage() {
  const { donations, stats } = useDonor()
  const recent = donations.slice(0, 3)

  return (
    <>
      <PageHeader title="Overview" description="Your food rescue activity at a glance." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total donations" value={stats.totalDonations} />
        <StatCard icon={Clock} label="Active listings" value={stats.activeListings} />
        <StatCard icon={CheckCircle2} label="Successful donations" value={stats.successfulDonations} />
        <StatCard
          icon={Utensils}
          label="Meals rescued"
          value={stats.mealsRescued}
          hint="Counted from meal donations only"
        />
      </div>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-semibold text-primary-800">Recent donations</h2>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/donor/donations"
              className="text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              View all
            </Link>
            <Link
              to="/dashboard/donor/add"
              className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add food
            </Link>
          </div>
        </div>

        {recent.length === 0 ? (
          <div className="mt-6 rounded-xl bg-cream-100 p-8 text-center">
            <p className="font-medium text-stone-700">No donations yet.</p>
            <p className="mt-1 text-sm text-stone-600">Post your first surplus food to get started.</p>
            <Link
              to="/dashboard/donor/add"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add food
            </Link>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-stone-100">
            {recent.map((donation) => (
              <li key={donation.id} className="flex items-center gap-4 py-4">
                <FoodImage
                  src={donation.image}
                  alt={donation.foodName}
                  className="h-14 w-14 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-stone-900">{donation.foodName}</p>
                  <p className="text-sm text-stone-600">
                    {formatQuantity(donation.quantity, donation.unit)}
                  </p>
                </div>
                <StatusBadge status={donation.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
