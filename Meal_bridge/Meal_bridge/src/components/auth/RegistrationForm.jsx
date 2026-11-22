import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import { validateRegistration } from '../../lib/validation.js'
import { registerUser } from '../../services/authService.js'
import FormField from './FormField.jsx'

const fieldId = (name) => `reg-${name}`

export default function RegistrationForm({ role }) {
  const navigate = useNavigate()
  const [values, setValues] = useState(() =>
    Object.fromEntries(role.fields.map((field) => [field.name, ''])),
  )
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    const nextValues = { ...values, [name]: value }
    setValues(nextValues)
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateRegistration(role.key, nextValues)[name] }))
    }
  }

  const handleBlur = (event) => {
    const { name } = event.target
    setErrors((prev) => ({ ...prev, [name]: validateRegistration(role.key, values)[name] }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateRegistration(role.key, values)
    setErrors(nextErrors)

    const firstInvalid = role.fields.find((field) => nextErrors[field.name])
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid.name))?.focus()
      return
    }

    setSubmitting(true)
    const result = await registerUser(role.key, values)
    setSubmitting(false)
    if (!result.ok) {
      setErrors((prev) => ({ ...prev, email: result.error }))
      return
    }
    navigate('/login', {
      state: {
        message: 'Account created. You can now log in.',
        email: values.email,
      },
    })
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
    <>
      <form noValidate onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
        {role.fields.map((field) => {
          const isPassword = field.type === 'password'
          return (
            <FormField
              key={field.name}
              id={fieldId(field.name)}
              name={field.name}
              label={field.label}
              type={isPassword && showPassword ? 'text' : field.type}
              value={values[field.name]}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={field.placeholder}
              autoComplete={field.autoComplete}
              options={field.options}
              required={field.required}
              error={errors[field.name]}
              rightSlot={isPassword ? passwordToggle : undefined}
            />
          )
        })}

        <Button
          type="submit"
          size="lg"
          className="w-full sm:col-span-2"
          disabled={submitting}
          icon={submitting ? undefined : UserPlus}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-primary-700 hover:text-primary-800">
          Login
        </Link>
      </p>
    </>
  )
}
