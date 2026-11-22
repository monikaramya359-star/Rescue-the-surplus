export function formatDateTime(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatQuantity(q, unit) {
  const label = unit ? String(unit).toLowerCase() : ''
  return `${q} ${label}`.trim()
}
