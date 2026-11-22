import { useEffect, useState } from 'react'
import { CheckCircle2, MapPin } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import FoodImage from '../ui/FoodImage.jsx'
import DeadlineWarning from './DeadlineWarning.jsx'
import { formatQuantity } from '../../lib/formatters.js'
import { getDeadlineState, useReceiver } from '../../context/ReceiverContext.jsx'

function allergenText(value) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'None listed'
  return value || 'None listed'
}

export default function ClaimModal({ listing, open, onClose, onClaimed }) {
  const { claimFood, now } = useReceiver()
  const availableQuantity = listing?.availableQuantity ?? 0
  const unit = listing?.unit ?? ''
  const [quantity, setQuantity] = useState(availableQuantity)
  const [claimError, setClaimError] = useState('')

  useEffect(() => {
    setQuantity(availableQuantity)
    setClaimError('')
  }, [listing?.id, open, availableQuantity])

  const errors = []
  const numericQuantity = Number(quantity)
  if (!Number.isInteger(numericQuantity) || numericQuantity < 1) {
    errors.push('Enter a whole number of at least 1')
  } else if (numericQuantity > availableQuantity) {
    errors.push(`You can claim at most ${availableQuantity} (the amount still available)`)
  }
  if (listing && getDeadlineState(listing.pickupDeadline, now).state === 'expired') {
    errors.push('This pickup deadline has passed')
  }

  const canConfirm = Boolean(listing) && errors.length === 0

  const handleQuantityChange = (event) => {
    setQuantity(event.target.value)
    setClaimError('')
  }

  const handleConfirm = () => {
    if (!canConfirm) return
    const result = claimFood(listing.id, numericQuantity)
    if (result.ok) {
      onClaimed(result.claim)
      onClose()
    } else {
      setClaimError(result.error)
    }
  }

  return (
    <Modal open={open} title="Confirm claim" onClose={onClose}>
      {listing && (
        <div className="space-y-5">
          <div className="flex gap-4">
            <FoodImage
              src={listing.image}
              alt={listing.foodName}
              className="h-20 w-20 shrink-0 rounded-2xl"
            />
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold text-stone-900">{listing.foodName}</p>
              <p className="text-sm text-stone-500">{listing.donorName}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-600">
                <MapPin className="h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                {listing.pickupLocation}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="font-semibold text-stone-800">Storage</dt>
              <dd className="text-stone-600">{listing.storage}</dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-800">Allergens</dt>
              <dd className="text-stone-600">{allergenText(listing.allergens)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="font-semibold text-stone-800">Available</dt>
              <dd className="text-stone-600">{formatQuantity(availableQuantity, unit)}</dd>
            </div>
          </dl>

          <DeadlineWarning deadline={listing.pickupDeadline} now={now} />

          <div>
            <label htmlFor="claim-quantity" className="block text-sm font-semibold text-stone-800">
              {`Quantity to claim (${unit})`}
            </label>
            <input
              id="claim-quantity"
              type="number"
              inputMode="numeric"
              min={1}
              max={availableQuantity}
              step={1}
              value={quantity}
              onChange={handleQuantityChange}
              className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
            <p className="mt-1 text-sm text-stone-500">{`Up to ${availableQuantity} available`}</p>
            {errors.map((message) => (
              <p key={message} role="alert" className="mt-2 text-sm text-red-600">
                {message}
              </p>
            ))}
          </div>

          <p className="text-sm text-stone-500">
            Pickup must happen before the deadline. You can track collection and delivery under My
            Claims.
          </p>
        </div>
      )}

      {claimError && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {claimError}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button
          type="button"
          icon={CheckCircle2}
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Confirm claim
        </Button>
      </div>
    </Modal>
  )
}
