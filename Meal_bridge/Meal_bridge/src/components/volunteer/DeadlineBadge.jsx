import { AlertCircle, AlertTriangle, Clock } from 'lucide-react'
import { getDeadlineState } from '../../context/ReceiverContext.jsx'
import { formatDateTime } from '../../lib/formatters.js'

const TONE = {
  expired: 'bg-red-50 text-red-800 border-red-200',
  closing: 'bg-amber-50 text-amber-900 border-amber-200',
  open: 'bg-primary-50 text-primary-800 border-primary-200',
}

function formatTimeLeft(minutesLeft) {
  if (minutesLeft < 60) return `Due in ${minutesLeft} min`
  return `Due in ${Math.floor(minutesLeft / 60)} h ${minutesLeft % 60} min`
}

export default function DeadlineBadge({ deadline, now }) {
  const { state, minutesLeft } = getDeadlineState(deadline, now)

  let Icon
  let label
  let sub
  if (state === 'expired') {
    Icon = AlertCircle
    label = 'Pickup deadline passed'
    sub = formatDateTime(deadline)
  } else if (state === 'closing') {
    Icon = AlertTriangle
    label = formatTimeLeft(minutesLeft)
    sub = 'Deadline ' + formatDateTime(deadline)
  } else {
    Icon = Clock
    label = 'Pickup by ' + formatDateTime(deadline)
    sub = 'Plenty of time left'
  }

  return (
    <div role="status" className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${TONE[state]}`}>
      <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold text-base">{label}</p>
        <p className="text-xs opacity-80">{sub}</p>
      </div>
    </div>
  )
}
