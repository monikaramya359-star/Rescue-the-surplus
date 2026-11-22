import PageHeader from '../../components/dashboard/PageHeader.jsx'
import { useVolunteer } from '../../context/VolunteerContext.jsx'

const fields = [
  { key: 'fullName', label: 'Full name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'location', label: 'Location' },
  { key: 'availability', label: 'Availability' },
  { key: 'vehicle', label: 'Vehicle' },
]

export default function VolunteerProfilePage() {
  const { profile } = useVolunteer()

  return (
    <>
      <PageHeader title="Profile" description="Your volunteer details." />

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <dl className="grid gap-5 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key}>
              <dt className="text-sm font-medium text-stone-600">{field.label}</dt>
              <dd className="mt-1 font-semibold text-stone-900">{profile[field.key] || '—'}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}
