import { Link } from 'react-router-dom'
import RoleCard from '../components/auth/RoleCard.jsx'
import { ROLE_ORDER, ROLES } from '../data/authRoles.js'

export default function RoleSelectionPage() {
  return (
    <section className="min-h-screen bg-cream px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-700">Get started</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-primary-800 sm:text-5xl">
          Join Rescue the Surplus
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600">
          Choose how you want to help. You can register as a donor, receiver or volunteer.
        </p>

        <div className="mt-12 grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_ORDER.map((key) => (
            <RoleCard key={key} role={ROLES[key]} />
          ))}
        </div>

        <p className="mt-10 text-sm text-stone-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-700 hover:text-primary-800">
            Login
          </Link>
        </p>
      </div>
    </section>
  )
}
