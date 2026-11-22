import { CheckCircle2, X } from 'lucide-react'
import { useEffect } from 'react'

export default function Toast({ notice, onDismiss }) {
  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(onDismiss, 4000)
    return () => window.clearTimeout(timer)
  }, [notice, onDismiss])

  if (!notice) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-[70] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-start gap-3 rounded-2xl bg-primary-800 px-4 py-3 text-white shadow-xl sm:bottom-6"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-300" aria-hidden="true" />
      <p className="flex-1 text-sm font-medium leading-relaxed">{notice.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary-100 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
