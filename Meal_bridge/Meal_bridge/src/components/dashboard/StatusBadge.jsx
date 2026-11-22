const statusStyles = {
  Active: 'bg-primary-50 text-primary-700',
  Claimed: 'bg-amber-50 text-amber-800',
  Collected: 'bg-sky-50 text-sky-800',
  Delivered: 'bg-primary-600 text-white',
  Expired: 'bg-stone-200 text-stone-700',
  Cancelled: 'bg-red-50 text-red-700',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        statusStyles[status] ?? 'bg-stone-100 text-stone-700'
      }`}
    >
      {status}
    </span>
  )
}
