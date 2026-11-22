import { AlertCircle, AlertTriangle, Clock } from 'lucide-react'
import { getDeadlineState } from '../../context/ReceiverContext.jsx'
import { formatDateTime } from '../../lib/formatters.js'

export default function DeadlineWarning({ deadline, now }) {
  const { state, minutesLeft } = getDeadlineState(deadline, now)

  if (state === 'expired') {
    return (
      <div
        role="status"
        className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm bg-red-50 text-red-700 border-red-200"
      >
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <span>Pickup deadline passed</span>
      </div>
    )
  }

  if (state === 'closing') {
    const remaining =
      minutesLeft < 60
        ? `${minutesLeft} min left`
        : `${Math.floor(minutesLeft / 60)} h ${minutesLeft % 60} min left`
    return (
      <div
        role="status"
        className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm bg-amber-50 text-amber-800 border-amber-200"
      >
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        <span>Closing soon: about {remaining}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-stone-600 border-stone-200 bg-white">
      <Clock className="h-4 w-4" aria-hidden="true" />
      <span>Pickup by {formatDateTime(deadline)}</span>
    </div>
  )
}
