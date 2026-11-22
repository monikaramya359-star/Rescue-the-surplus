import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Package, User, Truck, CheckCircle2 } from 'lucide-react'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import ReceiverStatusBadge from '../../components/receiver/ReceiverStatusBadge.jsx'
import DeadlineWarning from '../../components/receiver/DeadlineWarning.jsx'
import SafetyHandlingBlock from '../../components/SafetyHandlingBlock.jsx'
import Button from '../../components/ui/Button.jsx'
import FoodImage from '../../components/ui/FoodImage.jsx'
import { formatDateTime, formatQuantity } from '../../lib/formatters.js'
import { allergenLabels } from '../../lib/allergens.js'
import { useReceiver } from '../../context/ReceiverContext.jsx'
import { isSupabaseConfigured } from '../../lib/supabase.js'
import { normalizeListingStatus } from '../../lib/stateMachine.js'
import { cancelClaim, claimListing } from '../../services/mealService.js'

const TIMELINE = [
  { key: 'posted', label: 'Posted', icon: Package },
  { key: 'claimed', label: 'Claimed', icon: User },
  { key: 'collected', label: 'Collected', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
]

export default function ListingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { listings, claims, now } = useReceiver()

  const listing = listings.find((item) => item.id === id)
  // Cancelled claims are history; the receiver can claim again, so ignore them here.
  const claim = claims.find((item) => item.donationId === id && item.status !== 'Cancelled')
  const [, setPollKey] = useState(0)
  const [claimQuantity, setClaimQuantity] = useState(null)
  const [claimError, setClaimError] = useState('')
  const [claimBusy, setClaimBusy] = useState(false)
  const [cancelledClaimId, setCancelledClaimId] = useState(null)
  const busyRef = useRef(false)

  // Live polling (Supabase only): re-render every 12 seconds. The receiver context
  // refetches listings and claims on the same interval, so this picks up fresh data.
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    const timer = setInterval(() => setPollKey((k) => k + 1), 12000)
    return () => clearInterval(timer)
  }, [])

  if (!listing) {
    return (
      <div className="min-h-screen bg-cream-50 p-6">
        <PageHeader
          title="Listing not found"
          description="This food listing no longer exists."
        />
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <p className="text-stone-600">We couldn't find a listing with that ID.</p>
          <Link
            to="/dashboard/receiver/available"
            className="mt-4 inline-flex rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Browse available food
          </Link>
        </div>
      </div>
    )
  }

  const isExpired = new Date(listing.pickupDeadline).getTime() <= now
  const normalizedStatus = normalizeListingStatus(listing.status)
  const isClaimable = normalizedStatus === 'Active' && !isExpired
  const quantityValue = claimQuantity ?? listing.availableQuantity
  const hasActiveClaim = Boolean(claim) && claim.status === 'Claimed' && cancelledClaimId !== claim.id

  async function handleClaim() {
    if (busyRef.current) return
    const requested = Number(quantityValue)
    if (!Number.isInteger(requested) || requested < 1 || requested > listing.availableQuantity) {
      setClaimError(`Enter a whole number from 1 to ${listing.availableQuantity}.`)
      return
    }
    busyRef.current = true
    setClaimBusy(true)
    setClaimError('')
    const result = await claimListing(listing.id, requested)
    busyRef.current = false
    setClaimBusy(false)
    if (result.ok) {
      navigate('/dashboard/receiver/claims')
    } else {
      // The quantity input keeps its value so the receiver can retry.
      setClaimError(result.message)
    }
  }

  async function handleCancelClaim() {
    if (busyRef.current || !claim) return
    busyRef.current = true
    setClaimBusy(true)
    setClaimError('')
    const result = await cancelClaim(claim.id)
    busyRef.current = false
    setClaimBusy(false)
    if (result.ok) {
      setCancelledClaimId(claim.id)
    } else {
      setClaimError(result.message)
    }
  }

  const statusOrder = TIMELINE.map((step) => step.key)
  const claimStatusKey = claim?.status ? String(claim.status).toLowerCase() : null
  const reached = claimStatusKey
    ? statusOrder.indexOf(claimStatusKey)
    : normalizedStatus === 'Active'
      ? 0
      : -1

  return (
    <div className="min-h-screen bg-cream-50 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={listing.foodName}
        description={`Surplus food from ${listing.donorName}. ${listing.match ? `Why matched: ${listing.match.reasons.join(' • ')}` : ''}`}
        action={
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/receiver/available"
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Back to feed
            </Link>
          </div>
        }
      />

      <div className="mt-6 max-w-4xl mx-auto space-y-6">
        <article className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="relative">
            <FoodImage
              src={listing.image}
              alt={listing.foodName}
              className="h-56 w-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <ReceiverStatusBadge status={isExpired ? 'Expired' : listing.status} />
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-stone-900">
                  {listing.foodName}
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  {listing.donorName} · {listing.donorType}
                </p>
              </div>
              <div className="ml-auto flex items-end gap-2">
                <ReceiverStatusBadge
                  status={isExpired ? 'Expired' : listing.status}
                />
                <span className="text-xs font-medium text-stone-500">
                  {formatQuantity(listing.availableQuantity, listing.unit)} left
                </span>
              </div>
            </div>

            <dl className="mt-5 divide-y divide-stone-100 text-sm">
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="text-stone-500">Available</dt>
                <dd className="text-right text-stone-900">
                  {formatQuantity(listing.availableQuantity, listing.unit)} of{' '}
                  {formatQuantity(listing.quantity, listing.unit)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="text-stone-500">Distance</dt>
                <dd className="text-right text-stone-900">
                  {listing.match?.distanceKm == null
                    ? 'Approximate distance unavailable'
                    : `Approximately ${listing.match.distanceKm.toFixed(1)} km away`}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="text-stone-500">Prepared</dt>
                <dd className="text-right text-stone-900">
                  {formatDateTime(listing.preparedAt)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="text-stone-500">Storage</dt>
                <dd className="text-right text-stone-900">{listing.storage}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="text-stone-500">Allergens</dt>
                <dd className="text-right text-stone-900">
                  {allergenLabels(listing.allergens).join(', ') || 'None declared'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="text-stone-500">Pickup location</dt>
                <dd className="text-right text-stone-900 truncate max-w-xs">
                  {listing.pickupLocation}
                </dd>
              </div>
            </dl>

            <div className="mt-5">
              <DeadlineWarning deadline={listing.pickupDeadline} now={now} />
            </div>

            <SafetyHandlingBlock listing={listing} now={now} />

            {isClaimable && !claim && (
              <div className="mt-5 flex flex-col sm:flex-row sm:items-end gap-3">
                {isSupabaseConfigured && (
                  <label className="flex items-center gap-2 text-sm text-stone-700">
                    Quantity
                    <input
                      type="number"
                      min={1}
                      max={listing.availableQuantity}
                      step={1}
                      value={quantityValue}
                      onChange={(event) => setClaimQuantity(event.target.value)}
                      className="w-24 rounded-lg border border-stone-300 px-3 py-2 text-sm"
                    />
                    <span className="text-stone-500">{listing.unit}</span>
                  </label>
                )}
                <Button
                  variant="primary"
                  type="button"
                  disabled={claimBusy}
                  onClick={() => {
                    if (isSupabaseConfigured) {
                      handleClaim()
                    } else {
                      window.location.href = '/dashboard/receiver/claims'
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  {claimBusy ? 'Claiming…' : 'Claim this food'}
                </Button>
              </div>
            )}
            {claimError && (
              <p role="alert" className="mt-3 text-sm text-red-700">{claimError}</p>
            )}
            {claim && cancelledClaimId !== claim.id && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  You already claimed this food ({formatQuantity(claim.quantityClaimed, claim.unit)}). Track progress under My Claims.
                </p>
                {isSupabaseConfigured && hasActiveClaim && (
                  <button
                    type="button"
                    disabled={claimBusy}
                    onClick={handleCancelClaim}
                    className="mt-3 rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                  >
                    Cancel my claim
                  </button>
                )}
              </div>
            )}
            {claim && cancelledClaimId === claim.id && (
              <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm text-stone-700">
                  Your claim was cancelled. The listing will update within a few seconds.
                </p>
              </div>
            )}
          </div>
        </article>

        <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 bg-stone-50 p-4 sm:p-5">
            <h3 className="font-semibold text-stone-900">Pickup timeline</h3>
            <p className="mt-1 text-xs text-stone-500">
              Timestamps appear where the platform recorded them.
            </p>
          </div>
          <ol className="divide-y divide-stone-100 relative pl-4">
            <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-stone-200" />
            {TIMELINE.map((step, index) => {
              const done = index <= reached
              const timestamp =
                step.key === 'posted' ? listing.postedAt
                : step.key === 'claimed' ? claim?.claimedAt
                : step.key === 'collected' ? claim?.collectedAt
                : step.key === 'delivered' ? claim?.deliveredAt
                : null
              return (
                <li key={step.key} className="relative pl-8 py-4">
                  <span className={`absolute -left-[10px] top-2 h-4 w-4 rounded-full border-2 ${done ? 'bg-primary-600 border-primary-600' : 'bg-white border-stone-300'}`} />
                  <div className="flex items-center gap-2">
                    <step.icon className={`h-4 w-4 ${done ? 'text-primary-600' : 'text-stone-400'}`} aria-hidden="true" />
                    <span className={`text-sm font-semibold ${done ? 'text-stone-900' : 'text-stone-500'}`}>
                      {step.label}
                    </span>
                    {timestamp && (
                      <span className="ml-auto text-sm text-stone-500">
                        {formatDateTime(timestamp)}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
          {isSupabaseConfigured && (
            <p className="mt-3 text-xs text-stone-500 text-center">
              Status refreshes automatically every 12 seconds while this page is open.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
