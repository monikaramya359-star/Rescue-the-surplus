import { useMemo } from 'react'
import { ArrowRight, ClipboardList, Package, Search, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatCard from '../../components/dashboard/StatCard.jsx'
import ReceiverStatusBadge from '../../components/receiver/ReceiverStatusBadge.jsx'
import { useReceiver } from '../../context/ReceiverContext.jsx'
import { matchingReceivers } from '../../data/receiverData.js'
import { rankReceiversForListing } from '../../lib/foodMatching.js'
import { formatQuantity } from '../../lib/formatters.js'

export default function ReceiverOverviewPage() {
  const { claims, listings, now, stats } = useReceiver()

  const receivedParts = Object.entries(stats.foodReceived)
    .filter(([, total]) => total > 0)
    .map(([unit, total]) => formatQuantity(total, unit))
  const foodReceivedValue = receivedParts.length > 0 ? receivedParts.join(' / ') : '0'

  const recentClaims = claims.slice(0, 3)

  const bestMatches = useMemo(
    () =>
      listings
        .filter((listing) => listing.status === 'Available')
        .map((listing) => {
          // Context listings use 'Available' here, while the matcher expects the donor-side 'Active' status.
          const [best] = rankReceiversForListing({ ...listing, status: 'Active' }, matchingReceivers, now, 1)
          return best ? { listing, best } : null
        })
        .filter(Boolean)
        .sort((a, b) => b.best.score - a.best.score)
        .slice(0, 5),
    [listings, now],
  )

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Food you have found, claimed and distributed through your organisation."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Search}
          label="Available donations"
          value={stats.availableDonations}
          hint="Open listings nearby"
        />
        <StatCard
          icon={ClipboardList}
          label="Donations claimed"
          value={stats.donationsClaimed}
        />
        <StatCard
          icon={Package}
          label="Food received"
          value={foodReceivedValue}
          hint="Delivered to your organisation"
        />
        <StatCard
          icon={Utensils}
          label="Meals distributed"
          value={stats.mealsDistributed}
          hint="Counted from delivered meal donations"
        />
      </div>

      <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-semibold text-primary-800">Recent claims</h2>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/receiver/claims"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              View all
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/dashboard/receiver/available"
              className="inline-flex items-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              Find food
            </Link>
          </div>
        </div>

        {recentClaims.length === 0 ? (
          <p className="mt-6 text-sm text-stone-600">
            No claims yet. Browse available food to get started.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-stone-200">
            {recentClaims.map((claim) => (
              <li
                key={claim.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-900">{claim.foodName}</p>
                  <p className="text-sm text-stone-600">
                    {formatQuantity(claim.quantityClaimed, claim.unit)}
                  </p>
                </div>
                <ReceiverStatusBadge status={claim.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-xl font-semibold text-primary-800">Best matches</h2>
        <p className="mt-1 text-sm text-stone-600">Demo: matches shown for all listed receivers.</p>

        {bestMatches.length === 0 ? (
          <p className="mt-6 text-sm text-stone-600">No eligible receivers match the available food right now.</p>
        ) : (
          <ul className="mt-5 divide-y divide-stone-200">
            {bestMatches.map(({ listing, best }) => (
              <li
                key={listing.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-900">{listing.foodName}</p>
                  <p className="text-sm text-stone-600">{best.receiver.name}</p>
                  <p className="text-sm text-stone-500">{best.reasons.slice(0, 2).join(' · ')}</p>
                </div>
                <p className="shrink-0 text-lg font-semibold text-primary-700">{best.score}/100</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
