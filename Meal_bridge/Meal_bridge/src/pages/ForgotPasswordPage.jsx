import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormField from '../components/auth/FormField.jsx'
import Button from '../components/ui/Button.jsx'
import { validateForgotPassword } from '../lib/validation.js'
import { requestPasswordReset } from '../services/authService.js'

const emailError = (email) => validateForgotPassword({ email }).email ?? ''

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleChange = (event) => {
    const { value } = event.target
    setEmail(value)
    if (error) setError(emailError(value))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const message = emailError(email)
    setError(message)
    if (message) {
      document.getElementById('forgot-email')?.focus()
      return
    }

    setSubmitting(true)
    const result = await requestPasswordReset(email)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSent(true)
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email linked to your account and we will send a reset link."
      backTo="/login"
      backLabel="Back to login"
      footer={
        <p>
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-primary-700 hover:text-primary-800">
            Back to login
          </Link>
        </p>
      }
    >
      {sent ? (
        <div role="status" className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-14 w-14 text-primary-600" aria-hidden="true" />
          <p className="text-stone-700">
            If an account exists for that email, a reset link is on its way.
          </p>
          <Link
            to="/login"
            className="font-semibold text-primary-700 hover:text-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Return to login
          </Link>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit} className="space-y-5">
          <FormField
            id="forgot-email"
            name="email"
            label="Email address"
            type="email"
            value={email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
            error={error}
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
            icon={submitting ? undefined : KeyRound}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Sending link...
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
