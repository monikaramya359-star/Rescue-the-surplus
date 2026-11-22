import { Mail, MapPin, Pencil, Phone, Save, UserCircle, Utensils } from 'lucide-react'
import { useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import { useDonor } from '../../context/DonorContext.jsx'
import { validateDonorProfile } from '../../lib/validation.js'

const DONOR_TYPES = ['Restaurant', 'Caterer', 'Hostel mess', 'Bakery', 'Other food business']

const FIELDS = [
  { name: 'restaurantName', label: 'Restaurant name', icon: Utensils },
  { name: 'ownerName', label: 'Owner name', icon: UserCircle },
  { name: 'email', label: 'Email', icon: Mail, type: 'email' },
  { name: 'phone', label: 'Phone number', icon: Phone, type: 'tel' },
  { name: 'location', label: 'Location', icon: MapPin },
]


export default function DonorProfilePage() {
  const { profile, updateProfile } = useDonor()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  const startEditing = () => {
    setDraft(profile)
    setErrors({})
    setSaved(false)
    setEditing(true)
  }

  const cancelEditing = () => {
    setDraft(profile)
    setErrors({})
    setEditing(false)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setDraft((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validateDonorProfile(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    updateProfile({
      restaurantName: draft.restaurantName.trim(),
      ownerName: draft.ownerName.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      location: draft.location.trim(),
      donorType: draft.donorType,
    })
    setEditing(false)
    setSaved(true)
  }

  const inputClass = (name) =>
    `w-full rounded-xl border bg-white px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${
      errors[name] ? 'border-red-600' : 'border-stone-300 focus:border-primary-500'
    }`

  return (
    <>
      <PageHeader
        title="Profile"
        description="Keep your donor details up to date so NGOs and volunteers can reach you."
        action={
          !editing && (
            <Button variant="secondary" icon={Pencil} onClick={startEditing}>
              Edit profile
            </Button>
          )
        }
      />

      {saved && (
        <p
          role="status"
          className="mb-6 rounded-xl bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800"
        >
          Profile saved
        </p>
      )}

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
        {editing ? (
          <form onSubmit={handleSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
            {FIELDS.map(({ name, label, type = 'text' }) => (
              <div key={name} className={name === 'location' ? 'sm:col-span-2' : ''}>
                <label htmlFor={`profile-${name}`} className="mb-1.5 block text-sm font-medium text-stone-700">
                  {label}
                </label>
                <input
                  id={`profile-${name}`}
                  name={name}
                  type={type}
                  value={draft[name]}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors[name])}
                  aria-describedby={errors[name] ? `profile-${name}-error` : undefined}
                  className={inputClass(name)}
                />
                {errors[name] && (
                  <p id={`profile-${name}-error`} role="alert" className="mt-1.5 text-sm text-red-600">
                    {errors[name]}
                  </p>
                )}
              </div>
            ))}

            <div>
              <label htmlFor="profile-donorType" className="mb-1.5 block text-sm font-medium text-stone-700">
                Donor type
              </label>
              <select
                id="profile-donorType"
                name="donorType"
                value={draft.donorType}
                onChange={handleChange}
                aria-invalid={Boolean(errors.donorType)}
                aria-describedby={errors.donorType ? 'profile-donorType-error' : undefined}
                className={inputClass('donorType')}
              >
                {DONOR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.donorType && (
                <p id="profile-donorType-error" role="alert" className="mt-1.5 text-sm text-red-600">
                  {errors.donorType}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button type="submit" icon={Save}>
                Save changes
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-6 sm:grid-cols-2">
            {[...FIELDS, { name: 'donorType', label: 'Donor type' }].map(({ name, label }) => (
              <div key={name} className={name === 'location' ? 'sm:col-span-2' : ''}>
                <dt className="text-sm font-medium text-stone-500">{label}</dt>
                <dd className="mt-1 text-base font-semibold text-stone-900">{profile[name]}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </>
  )
}
