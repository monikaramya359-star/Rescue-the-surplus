import { Link, Navigate, useParams } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import RegistrationForm from '../components/auth/RegistrationForm.jsx'
import { ROLE_ORDER, ROLES, getRole } from '../data/authRoles.js'

export default function RegisterPage() {
  const { role: roleKey } = useParams()
  const role = getRole(roleKey)

  if (!role) return <Navigate to="/register" replace />

  const otherRoles = ROLE_ORDER.filter((key) => key !== role.key).map((key) => ROLES[key])

  return (
    <AuthLayout
      title={role.registerTitle}
      subtitle="Tell us a little about you so we can match food with the right people."
      backTo="/register"
      backLabel="All roles"
      wide
      footer={
        <p>
          Want to join as someone else?{' '}
          {otherRoles.map((other, index) => (
            <span key={other.key}>
              {index > 0 && ' or '}
              <Link
                to={`/register/${other.key}`}
                className="font-semibold text-primary-700 hover:text-primary-800"
              >
                {other.shortLabel}
              </Link>
            </span>
          ))}
        </p>
      }
    >
      <RegistrationForm key={role.key} role={role} />
    </AuthLayout>
  )
}
