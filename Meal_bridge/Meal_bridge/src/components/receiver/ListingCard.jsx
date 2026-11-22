import { Package } from 'lucide-react'
import Button from '../ui/Button'
import FoodImage from '../ui/FoodImage'
import { formatDateTime, formatQuantity } from '../../lib/formatters'
import ReceiverStatusBadge from './ReceiverStatusBadge'
import DeadlineWarning from './DeadlineWarning'
import SafetyHandlingBlock from '../SafetyHandlingBlock.jsx'
import { allergenLabels } from '../../lib/allergens.js'

export default function ListingCard({ listing, now, onView, onClaim }) {
  const isClaimable = listing.status === 'Available'

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative">
        <FoodImage
          src={listing.image}
          alt={listing.foodName}
          className="aspect-[4/3] w-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <ReceiverStatusBadge status={listing.status} />
        </div>
      </div>

      <div className="flex-1 p-5">
        <h3 className="font-display text-lg text-stone-900">{listing.foodName}</h3>
        <p className="mt-1 text-sm text-stone-500">
          {listing.donorName} · {listing.donorType}
        </p>

        <dl className="mt-4 divide-y divide-stone-100 text-sm">
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
        </dl>

        <div className="mt-4">
          <DeadlineWarning deadline={listing.pickupDeadline} now={now} />
        </div>
        <div className="mt-4">
          <SafetyHandlingBlock listing={listing} now={now} compact />
        </div>
        {listing.match?.reasons && (
          <p className="mt-3 text-xs font-medium text-primary-800">
            Why matched: {listing.match.reasons.join(' • ')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 p-5 pt-0 sm:flex-row">
        {listing.pickupLocation && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.pickupLocation)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-full border border-primary-600 px-5 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50 sm:w-auto"
          >
            Open map
          </a>
        )}
        <Button
          variant="outline"
          type="button"
          className="w-full sm:w-auto"
          onClick={() => onView(listing)}
        >
          View Details
        </Button>
        <Button
          variant="primary"
          type="button"
          icon={Package}
          className={`w-full sm:w-auto ${isClaimable ? '' : 'opacity-50 cursor-not-allowed'}`}
          disabled={!isClaimable}
          onClick={() => onClaim(listing)}
        >
          Claim Food
        </Button>
      </div>
    </article>
  )
}
