import { ArrowRight, Bike, Handshake, Store } from 'lucide-react'
import { Link } from 'react-router-dom'

const ICONS = { Bike, Handshake, Store }

export default function RoleCard({ role }) {
  const Icon = ICONS[role.icon]

  return (
    <Link
      to={`/register/${role.key}`}
      aria-label={role.title}
      className="group flex h-full flex-col rounded-3xl border border-stone-200 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-primary-700">
        {role.accent}
      </p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-primary-800">{role.title}</h2>
      <p className="mt-2 flex-1 text-stone-600">{role.description}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-700">
        Continue
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  )
}
