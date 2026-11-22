import { Package } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import FoodImage from '../ui/FoodImage.jsx'
import DeadlineWarning from './DeadlineWarning.jsx'
import ReceiverStatusBadge from './ReceiverStatusBadge.jsx'
import { formatDateTime, formatQuantity } from '../../lib/formatters.js'
import { useReceiver } from '../../context/ReceiverContext.jsx'

function allergenText(value) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'None listed'
  return value || 'None listed'
}

export default function DonationDetailsModal({ listing, open, onClose, onClaim }) {
  const { now } = useReceiver()
  const canClaim = listing?.status === 'Available'

  return (
    <Modal open={open} title={listing?.foodName || ''} onClose={onClose}>
      {listing && (
        <div className="space-y-5">
          <FoodImage
            src={listing.image}
            alt={listing.foodName}
            className="aspect-video w-full rounded-2xl"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-stone-900">{listing.donorName}</p>
              <p className="text-sm text-stone-500">{listing.donorType}</p>
            </div>
            <ReceiverStatusBadge status={listing.status} />
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="font-semibold text-stone-800">Category</dt>
              <dd className="text-stone-600">{listing.category}</dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-800">Available</dt>
              <dd className="text-stone-600">
                {`${listing.availableQuantity} of ${formatQuantity(listing.quantity, listing.unit)}`}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-800">Distance</dt>
              <dd className="text-stone-600">
                {listing.distanceKm == null ? 'Distance unavailable' : `${listing.distanceKm.toFixed(1)} km away`}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-800">Prepared</dt>
              <dd className="text-stone-600">{formatDateTime(listing.preparedAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-800">Storage</dt>
              <dd className="text-stone-600">{listing.storage}</dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-800">Allergens</dt>
              <dd className="text-stone-600">{allergenText(listing.allergens)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="font-semibold text-stone-800">Pickup location</dt>
              <dd className="text-stone-600">{listing.pickupLocation}</dd>
            </div>
          </dl>

          <DeadlineWarning deadline={listing.pickupDeadline} now={now} />
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Close
        </Button>
        <Button
          variant="primary"
          icon={Package}
          onClick={() => onClaim(listing)}
          disabled={!canClaim}
          className="w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Claim Food
        </Button>
      </div>
    </Modal>
  )
}
