import { Pencil, Save } from 'lucide-react'
import { useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import { useReceiver } from '../../context/ReceiverContext.jsx'
import { ORGANIZATION_TYPES } from '../../data/receiverData.js'
import { validateOrganizationProfile } from '../../lib/validation.js'

const FIELDS = [
  { name: 'organizationName', label: 'Organization name' },
  { name: 'contactPerson', label: 'Contact person' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone number', type: 'tel' },
  { name: 'organizationType', label: 'Organization type', options: ORGANIZATION_TYPES },
  { name: 'location', label: 'Location' },
  { name: 'capacityMealsPerDay', label: 'Meals you can distribute per day', type: 'number' },
]


export default function OrganizationProfilePage() {
  const { profile, updateProfile } = useReceiver()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  const startEditing = () => {
    setDraft({ ...profile, capacityMealsPerDay: String(profile.capacityMealsPerDay) })
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
    const nextErrors = validateOrganizationProfile(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    updateProfile({
      organizationName: draft.organizationName.trim(),
      contactPerson: draft.contactPerson.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      organizationType: draft.organizationType,
      location: draft.location.trim(),
      capacityMealsPerDay: Number(draft.capacityMealsPerDay),
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
        title="Organization Profile"
        description="Keep your details current so donors know who they are supplying."
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
            {FIELDS.map(({ name, label, type = 'text', options }) => (
              <div key={name} className={name === 'location' ? 'sm:col-span-2' : ''}>
                <label htmlFor={`profile-${name}`} className="mb-1.5 block text-sm font-medium text-stone-700">
                  {label}
                </label>
                {options ? (
                  <select
                    id={`profile-${name}`}
                    name={name}
                    value={draft[name]}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors[name])}
                    aria-describedby={errors[name] ? `profile-${name}-error` : undefined}
                    className={inputClass(name)}
                  >
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`profile-${name}`}
                    name={name}
                    type={type}
                    min={type === 'number' ? 1 : undefined}
                    step={type === 'number' ? 1 : undefined}
                    value={draft[name]}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors[name])}
                    aria-describedby={errors[name] ? `profile-${name}-error` : undefined}
                    className={inputClass(name)}
                  />
                )}
                {errors[name] && (
                  <p id={`profile-${name}-error`} role="alert" className="mt-1.5 text-sm text-red-600">
                    {errors[name]}
                  </p>
                )}
              </div>
            ))}

            <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={Save}>
                Save changes
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-6 sm:grid-cols-2">
            {FIELDS.map(({ name, label }) => (
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
