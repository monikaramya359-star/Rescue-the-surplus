import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormField from '../components/auth/FormField.jsx'
import Button from '../components/ui/Button.jsx'
import { updatePassword } from '../services/authService.js'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSubmitting(true)
    const result = await updatePassword(password)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate('/login', { replace: true, state: { message: 'Password updated. Please log in.' } })
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password for your account." backTo="/login" backLabel="Back to login">
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <FormField
          id="reset-password"
          name="password"
          label="New password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
          error={error}
        />
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Updating...' : 'Update password'}
        </Button>
      </form>
    </AuthLayout>
  )
}
