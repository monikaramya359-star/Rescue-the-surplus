import { CheckCircle2, ClipboardCheck, Package, UserCheck } from 'lucide-react'

export const PROGRESS_STEPS = ['Claimed', 'Pickup Assigned', 'Collected', 'Delivered']

const STEP_ICONS = [ClipboardCheck, UserCheck, Package, CheckCircle2]

const badgeStyles = {
  completed: 'bg-primary-600 text-white',
  current: 'bg-amber-100 text-amber-800 ring-4 ring-amber-100',
  upcoming: 'bg-stone-100 text-stone-400',
}

export default function PickupProgress({ status }) {
  const currentIndex = Math.max(PROGRESS_STEPS.indexOf(status), 0)

  return (
    <ol aria-label="Pickup progress" className="flex flex-col sm:flex-row">
      {PROGRESS_STEPS.map((label, index) => {
        const Icon = STEP_ICONS[index]
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const badgeState = isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'

        return (
          <li
            key={label}
            aria-current={isCurrent ? 'step' : undefined}
            className="relative flex flex-1 items-center gap-3 pb-6 last:pb-0 sm:flex-col sm:gap-2 sm:pb-0 sm:text-center"
          >
            {index < PROGRESS_STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute left-5 top-10 bottom-0 w-0.5 -translate-x-1/2 sm:left-1/2 sm:top-5 sm:bottom-auto sm:h-0.5 sm:w-full sm:translate-x-0 ${
                  isCompleted ? 'bg-primary-600' : 'bg-stone-200'
                }`}
              />
            )}

            <span
              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${badgeStyles[badgeState]}`}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
            </span>

            <div className="flex flex-col sm:items-center">
              <span
                className={`text-sm ${
                  isCompleted || isCurrent ? 'text-stone-900' : 'text-stone-500'
                } ${isCurrent ? 'font-semibold' : ''}`}
              >
                {label}
              </span>
              {isCompleted && <span className="text-xs text-primary-700">Done</span>}
              {isCurrent && <span className="text-xs font-semibold text-amber-800">Now</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
