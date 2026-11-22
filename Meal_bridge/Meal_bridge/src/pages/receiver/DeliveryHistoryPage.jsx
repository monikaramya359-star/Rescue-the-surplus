import { useMemo, useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import { useReceiver } from '../../context/ReceiverContext.jsx'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import ReceiverStatusBadge from '../../components/receiver/ReceiverStatusBadge.jsx'
import Button from '../../components/ui/Button.jsx'
import { formatDateTime, formatQuantity } from '../../lib/formatters.js'

const COMPLETED_STATUSES = ['Collected', 'Delivered']

function latestTimestamp(claim) {
  return [claim.deliveredAt, claim.collectedAt, claim.claimedAt]
    .filter(Boolean)
    .map((iso) => new Date(iso).getTime())
    .reduce((latest, time) => (time > latest ? time : latest), 0)
}

export default function DeliveryHistoryPage() {
  const { claims } = useReceiver()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All statuses')

  const records = useMemo(() => {
    const query = search.trim().toLowerCase()
    return claims
      .filter((claim) => COMPLETED_STATUSES.includes(claim.status))
      .filter((claim) => status === 'All statuses' || claim.status === status)
      .filter(
        (claim) =>
          !query ||
          claim.foodName.toLowerCase().includes(query) ||
          claim.donorName.toLowerCase().includes(query),
      )
      .sort((a, b) => latestTimestamp(b) - latestTimestamp(a))
  }, [claims, search, status])

  const mealsDelivered = records
    .filter((claim) => claim.status === 'Delivered' && claim.unit === 'Meals')
    .reduce((sum, claim) => sum + Number(claim.quantityClaimed || 0), 0)

  const hasFilters = search.trim() !== '' || status !== 'All statuses'

  const clearFilters = () => {
    setSearch('')
    setStatus('All statuses')
  }

  return (
    <div>
      <PageHeader
        title="Delivery History"
        description="Completed collections and deliveries, newest first."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="history-search" className="mb-1.5 block text-sm font-medium text-stone-700">
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              id="history-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by food or donor"
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-800 placeholder:text-stone-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="history-status" className="mb-1.5 block text-sm font-medium text-stone-700">
            Status
          </label>
          <select
            id="history-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option>All statuses</option>
            <option>Collected</option>
            <option>Delivered</option>
          </select>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-stone-600">
        <span>{records.length} completed records</span>
        <span>Meals delivered: {mealsDelivered}</span>
      </div>

      {records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="text-stone-600">No completed records match your search.</p>
          {hasFilters && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="md" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {records.map((claim) => (
            <li
              key={claim.id}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold text-primary-800">
                    {claim.foodName}
                  </h3>
                  <p className="mt-0.5 text-sm text-stone-600">{claim.donorName}</p>
                </div>
                <ReceiverStatusBadge status={claim.status} />
              </div>

              <div className="mt-4 flex flex-col gap-2 text-sm text-stone-700 sm:flex-row sm:flex-wrap sm:gap-x-6">
                <span className="font-semibold text-stone-800">
                  {formatQuantity(claim.quantityClaimed, claim.unit)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-stone-400" aria-hidden="true" />
                  {claim.pickupLocation}
                </span>
              </div>

              <ul className="mt-4 flex flex-col gap-1 border-t border-stone-100 pt-3 text-xs text-stone-500 sm:flex-row sm:flex-wrap sm:gap-x-6">
                <li>Claimed {formatDateTime(claim.claimedAt)}</li>
                {claim.collectedAt && <li>Collected {formatDateTime(claim.collectedAt)}</li>}
                {claim.deliveredAt && <li>Delivered {formatDateTime(claim.deliveredAt)}</li>}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
