import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useReceiver } from '../../context/ReceiverContext.jsx'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import ReceiverStatusBadge from '../../components/receiver/ReceiverStatusBadge.jsx'
import DeadlineWarning from '../../components/receiver/DeadlineWarning.jsx'
import FoodImage from '../../components/ui/FoodImage.jsx'
import { formatDateTime, formatQuantity } from '../../lib/formatters.js'
import { isSupabaseConfigured } from '../../lib/supabase.js'
import { cancelClaim } from '../../services/mealService.js'

const FILTERS = ['All', 'Claimed', 'Collected', 'Delivered']

const STEPS = [
  { label: 'Claimed', text: 'Reserved for you, pickup pending.' },
  { label: 'Collected', text: 'You picked it up.' },
  { label: 'Delivered', text: 'Handed to the people you serve.' },
]

export default function MyClaimsPage() {
  const { claims, now } = useReceiver()
  const [filter, setFilter] = useState('All')
  const [busyId, setBusyId] = useState(null)
  const [cancelledIds, setCancelledIds] = useState([])
  const [actionError, setActionError] = useState('')
  const busyRef = useRef(false)

  const visibleClaims =
    filter === 'All' ? claims : claims.filter((claim) => claim.status === filter)

  // Receivers may only cancel their own claim while it is still Claimed.
  async function handleCancel(claimId) {
    if (busyRef.current) return
    busyRef.current = true
    setBusyId(claimId)
    setActionError('')
    const result = await cancelClaim(claimId)
    busyRef.current = false
    setBusyId(null)
    if (result.ok) {
      setCancelledIds((prev) => [...prev, claimId])
    } else {
      setActionError(result.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="My Claims"
        description="Claimed food and its pickup progress. Only you can move a claim forward."
      />

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter claims by status">
        {FILTERS.map((name) => {
          const count =
            name === 'All' ? claims.length : claims.filter((claim) => claim.status === name).length
          const active = filter === name
          return (
            <button
              key={name}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(name)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                active
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-primary-50'
              }`}
            >
              {name} <span className="ml-1 opacity-80">({count})</span>
            </button>
          )
        })}
      </div>

      <ol className="mb-8 grid gap-3 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.label} className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
              {index + 1}
            </span>
            <p className="text-sm text-stone-600">
              <span className="font-semibold text-primary-800">{step.label}</span> = {step.text}
            </p>
          </li>
        ))}
      </ol>

      {actionError && (
        <p role="alert" className="mb-4 text-sm text-red-700">{actionError}</p>
      )}

      {visibleClaims.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <p className="text-stone-600">No claims here yet.</p>
          <Link
            to="/dashboard/receiver/available"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/25 hover:bg-primary-700"
          >
            Find food
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visibleClaims.map((claim) => (
            <article
              key={claim.id}
              className="flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"
            >
              <div className="relative">
                <FoodImage
                  src={claim.image}
                  alt={claim.foodName}
                  className="aspect-[4/3] w-full rounded-t-2xl"
                />
                <div className="absolute left-3 top-3">
                  <ReceiverStatusBadge status={claim.status} />
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-5">
                <div>
                  <h2 className="font-display text-xl font-semibold text-primary-800">
                    {claim.foodName}
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">{claim.donorName}</p>
                </div>

                <dl className="grid gap-2 text-sm text-stone-700">
                  <div>
                    <dt className="sr-only">Quantity claimed</dt>
                    <dd className="font-semibold">
                      {formatQuantity(claim.quantityClaimed, claim.unit)}
                    </dd>
                  </div>
                  <div>
                    <dt className="sr-only">Pickup location</dt>
                    <dd>{claim.pickupLocation}</dd>
                  </div>
                  <div>
                    <dt className="sr-only">Storage</dt>
                    <dd>{claim.storage}</dd>
                  </div>
                </dl>

                <ul className="grid gap-1 text-xs text-stone-500">
                  <li>Claimed {formatDateTime(claim.claimedAt)}</li>
                  {claim.collectedAt && <li>Collected {formatDateTime(claim.collectedAt)}</li>}
                  {claim.deliveredAt && <li>Delivered {formatDateTime(claim.deliveredAt)}</li>}
                </ul>

                {claim.status === 'Claimed' && (
                  <DeadlineWarning deadline={claim.pickupDeadline} now={now} />
                )}

                {isSupabaseConfigured && claim.status === 'Claimed' && !cancelledIds.includes(claim.id) && (
                  <button
                    type="button"
                    disabled={busyId === claim.id}
                    onClick={() => handleCancel(claim.id)}
                    className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
                  >
                    {busyId === claim.id ? 'Cancelling…' : 'Cancel my claim'}
                  </button>
                )}
                {cancelledIds.includes(claim.id) && (
                  <p className="text-sm text-stone-600">Your claim was cancelled.</p>
                )}

                <p className="mt-auto pt-2 text-xs text-stone-500">
                  Pickup progress is updated by the assigned volunteer.
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
