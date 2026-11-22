import { MapPin, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'
import FoodImage from '../../components/ui/FoodImage.jsx'
import { DONATION_STATUSES } from '../../data/donorData.js'
import { useDonor } from '../../context/DonorContext.jsx'
import { formatDateTime, formatQuantity } from '../../lib/formatters.js'

export default function DonationHistoryPage() {
  const { donations } = useDonor()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return [...donations]
      .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
      .filter((d) => !statusFilter || d.status === statusFilter)
      .filter(
        (d) =>
          !term ||
          d.foodName.toLowerCase().includes(term) ||
          d.category.toLowerCase().includes(term),
      )
  }, [donations, query, statusFilter])

  const inputClass =
    'w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30'

  return (
    <>
      <PageHeader
        title="Donation History"
        description="Every donation you have posted, newest first, including completed and closed ones."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by food name or category"
            aria-label="Search donations"
            className={`${inputClass} pl-10`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
          className={inputClass}
        >
          <option value="">All statuses</option>
          {DONATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-600">
          No donations match your search or filter.
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((donation) => (
            <li
              key={donation.id}
              className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <FoodImage
                  src={donation.image}
                  alt={donation.foodName}
                  className="h-14 w-14 shrink-0 rounded-xl"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-900">{donation.foodName}</p>
                  <p className="text-sm text-stone-600">
                    {donation.category} · {formatQuantity(donation.quantity, donation.unit)}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{donation.pickupLocation}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                <StatusBadge status={donation.status} />
                <time dateTime={donation.postedAt} className="text-xs text-stone-500">
                  {formatDateTime(donation.postedAt)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
