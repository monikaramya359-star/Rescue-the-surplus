import { AlertTriangle, Clock } from 'lucide-react'
import { getHandlingGuidance, SAFETY_DISCLAIMER } from '../lib/handlingGuidance.js'
import { formatDateTime } from '../lib/formatters.js'
import { allergenLabels } from '../lib/allergens.js'

export default function SafetyHandlingBlock({ listing, now, compact = false }) {
  if (!listing) return null
  const deadline = new Date(listing.pickupDeadline).getTime()
  const remaining = Math.max(0, deadline - (now || deadline))
  const minutes = Math.ceil(remaining / 60000)
  const countdown = minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes}m`

  return (
    <section className={`rounded-xl border border-amber-200 bg-amber-50 ${compact ? 'p-3' : 'p-4'}`} aria-label="Food handling guidance">
      <div className="flex items-start gap-2">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
        <p className="text-sm font-semibold text-amber-900">
          Pickup by {formatDateTime(listing.pickupDeadline)} · {countdown} remaining
        </p>
      </div>
      <p className="mt-2 text-sm text-stone-700">
        <strong>Storage:</strong> {listing.storage || 'Follow donor guidance'}
      </p>
      <p className="mt-1 text-sm text-stone-700">
        <strong>Allergens:</strong> {allergenLabels(listing.allergens).join(', ') || 'None declared'}
      </p>
      <p className="mt-1 text-sm text-stone-700">{getHandlingGuidance(listing.storage)}</p>
      <p className="mt-2 flex items-start gap-2 text-xs text-stone-600">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {SAFETY_DISCLAIMER}
      </p>
    </section>
  )
}
