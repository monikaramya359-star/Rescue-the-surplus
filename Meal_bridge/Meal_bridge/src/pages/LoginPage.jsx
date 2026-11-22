import { CheckCircle2, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormField from '../components/auth/FormField.jsx'
import Button from '../components/ui/Button.jsx'
import { useDemo } from '../context/DemoContext.jsx'
import { validateLogin } from '../lib/validation.js'
import { loginUser } from '../services/authService.js'

const ROLE_OPTIONS = [
  { value: 'donor', label: 'Donor (post surplus food)' },
  { value: 'receiver', label: 'Receiver (claim and receive food)' },
  { value: 'volunteer', label: 'Volunteer (pick up and deliver)' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useDemo()
  const successMessage = location.state?.message

  const [values, setValues] = useState(() => ({
    email: location.state?.email ?? '',
    password: '',
    role: 'donor',
  }))
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    const nextValues = { ...values, [name]: value }
    setValues(nextValues)
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateLogin(nextValues)[name] }))
    }
  }

  const handleBlur = (event) => {
    const { name } = event.target
    setErrors((prev) => ({ ...prev, [name]: validateLogin(values)[name] }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateLogin(values)
    setErrors(nextErrors)

    if (nextErrors.email || nextErrors.password) {
      document.getElementById(nextErrors.email ? 'login-email' : 'login-password')?.focus()
      return
    }

    setSubmitting(true)
    const result = await loginUser({ ...values, role: values.role })
    setSubmitting(false)
    if (!result.ok) {
      setErrors((prev) => ({ ...prev, password: result.error }))
      return
    }
    showToast('Login successful.')
    const role = result.user.role || result.user.user_metadata?.role
    if (role === 'admin') navigate('/admin', { replace: true })
    else if (role === 'sponsor') navigate('/sponsor', { replace: true })
    else if (['donor', 'receiver', 'volunteer'].includes(role)) {
      navigate(`/dashboard/${role}`, { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((visible) => !visible)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      className="rounded-lg p-2 text-stone-500 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      {showPassword ? (
        <EyeOff className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Eye className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  )

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to donate, receive or volunteer."
      backTo="/"
      backLabel="Back to home"
      footer={
        <p>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-primary-700 hover:text-primary-800">
            Register
          </Link>
        </p>
      }
    >
      {successMessage && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-800"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" />
          {successMessage}
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <FormField
          id="login-email"
          name="email"
          label="Email address"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="you@example.com"
          autoComplete="email"
          required
          error={errors.email}
        />

        <div>
          <FormField
            id="login-password"
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="current-password"
            required
            error={errors.password}
            rightSlot={passwordToggle}
          />
          <div className="mt-2 flex justify-end">
            <Link
              to="/forgot-password"
              className="rounded text-sm font-semibold text-primary-700 hover:text-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div>
          <label htmlFor="login-role" className="block text-sm font-semibold text-stone-800 mb-2">
            Log in as
          </label>
          <select
            id="login-role"
            name="role"
            value={values.role}
            onChange={(event) => setValues((prev) => ({ ...prev, role: event.target.value }))}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={submitting}
          icon={submitting ? undefined : LogIn}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Logging in...
            </>
          ) : (
            'Log in'
          )}
        </Button>
      </form>
    </AuthLayout>
  )
}
