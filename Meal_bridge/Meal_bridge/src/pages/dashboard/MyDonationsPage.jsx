import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ban, CalendarClock, Clock, MapPin, PlusCircle, Scale, Pencil, ShieldCheck, Utensils } from 'lucide-react'
import { useDonor } from '../../context/DonorContext.jsx'
import { DONATION_STATUSES } from '../../data/donorData.js'
import { formatDateTime, formatQuantity } from '../../lib/formatters.js'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'
import FoodImage from '../../components/ui/FoodImage.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import { downloadCsv } from '../../lib/reportExport.js'
import { IMPACT_CONFIG, impactFromDeliveredListings } from '../../lib/impactConfig.js'

const ALL_FILTER = 'All'
const EDITABLE_STATUSES = ['Active', 'Claimed']

const actionBase =
  'inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
const actionEnabled = 'border border-primary-600 bg-white text-primary-700 hover:bg-primary-50'
const actionDisabled = 'cursor-not-allowed border border-stone-200 bg-stone-100 text-stone-400'

function DetailRow({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-2 text-sm text-stone-600">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
      <span className="min-w-0">{children}</span>
    </li>
  )
}

export default function MyDonationsPage() {
  const { donations, cancelDonation } = useDonor()
  const navigate = useNavigate()
  const [filter, setFilter] = useState(ALL_FILTER)
  const [cancelTarget, setCancelTarget] = useState(null)

  const counts = useMemo(() => {
    const result = { [ALL_FILTER]: donations.length }
    DONATION_STATUSES.forEach((status) => {
      result[status] = donations.filter((d) => d.status === status).length
    })
    return result
  }, [donations])

  const visibleDonations = useMemo(
    () => (filter === ALL_FILTER ? donations : donations.filter((d) => d.status === filter)),
    [donations, filter],
  )

  const filters = [ALL_FILTER, ...DONATION_STATUSES]

  const handleConfirmCancel = () => {
    if (cancelTarget) cancelDonation(cancelTarget.id)
    setCancelTarget(null)
  }

  const handleDownloadImpact = () => {
    const impact = impactFromDeliveredListings(
      donations.map((donation) => ({ ...donation, status: donation.status })),
    )
    downloadCsv('donor-impact-report.csv', [{
      'Meals saved': impact.mealsSaved,
      'Kg rescued': impact.kgRescued,
      'CO2e avoided (kg)': impact.kgCo2eAvoided,
      'Completed pickups': impact.completedPickups,
      'Calculation': `${IMPACT_CONFIG.gramsPerMeal} g/meal; ${IMPACT_CONFIG.kgCo2ePerKgFood} kg CO2e/kg`,
    }])
  }

  return (
    <div className="min-h-full bg-cream-50 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="My Donations"
        description="Track each listing from posting to delivery."
        action={
          <div className="flex flex-wrap gap-3">
          <Link
            to="/dashboard/donor/add"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Add food
          </Link>
          <Button type="button" variant="outline" onClick={handleDownloadImpact}>
            Download impact
          </Button>
          </div>
        }
      />

      <section className="mb-8 rounded-2xl border border-primary-100 bg-amber-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-primary-800">Why track your donations?</h2>
            <p className="mt-2 text-sm text-stone-600">
              Keep a verifiable record of every kilogram you rescue. Each delivered listing counts toward your impact,
              and you can download a shareable impact report at any time.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-stone-500">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600" aria-hidden="true" />
              Verified impact metrics
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" aria-hidden="true" />
              Downloadable CSV report
            </span>
            <span className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-green-600" aria-hidden="true" />
              Meals counted per listing
            </span>
          </div>
        </div>
      </section>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter donations by status">
        {filters.map((status) => {
          const active = filter === status
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(status)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                active
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                  : 'border border-stone-200 bg-white text-stone-700 hover:border-primary-300 hover:text-primary-700'
              }`}
            >
              {status}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {counts[status]}
              </span>
            </button>
          )
        })}
      </div>

      {visibleDonations.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <h2 className="font-display text-xl font-semibold text-primary-800">No donations here yet</h2>
          <p className="mt-2 text-sm text-stone-600">
            There are no listings with the &ldquo;{filter}&rdquo; status right now.
          </p>
          <button
            type="button"
            onClick={() => setFilter(ALL_FILTER)}
            className="mt-6 inline-flex items-center justify-center rounded-full border border-primary-600 bg-white px-5 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Show all donations
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visibleDonations.map((donation) => {
            const canEdit = EDITABLE_STATUSES.includes(donation.status)
            return (
              <li
                key={donation.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
              >
                <div className="relative">
                  <FoodImage
                    src={donation.image}
                    alt={donation.foodName}
                    className="aspect-[4/3] w-full rounded-t-2xl object-cover"
                  />
                  <div className="absolute left-3 top-3">
                    <StatusBadge status={donation.status} />
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <h2 className="font-display text-xl font-semibold text-stone-900">{donation.foodName}</h2>

                  <ul className="flex flex-col gap-2">
                    <DetailRow icon={Scale}>{formatQuantity(donation.quantity, donation.unit)}</DetailRow>
                    <DetailRow icon={Clock}>Posted {formatDateTime(donation.postedAt)}</DetailRow>
                    <DetailRow icon={CalendarClock}>
                      Pickup by {formatDateTime(donation.pickupDeadline)}
                    </DetailRow>
                    <DetailRow icon={MapPin}>{donation.pickupLocation}</DetailRow>
                  </ul>

                  <div className="mt-auto flex gap-3 pt-2">
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => navigate('/dashboard/donor/add', { state: { donation } })}
                      className={`${actionBase} ${canEdit ? actionEnabled : actionDisabled}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setCancelTarget(donation)}
                      className={`${actionBase} ${canEdit ? actionEnabled : actionDisabled}`}
                    >
                      <Ban className="h-4 w-4" aria-hidden="true" />
                      Cancel listing
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={Boolean(cancelTarget)} title="Cancel this listing?" onClose={() => setCancelTarget(null)}>
        <p>
          {cancelTarget ? `“${cancelTarget.foodName}” ` : 'This listing '}will be marked as Cancelled. It will not be
          removed from your donation history.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setCancelTarget(null)}>
            Keep listing
          </Button>
          <Button variant="primary" onClick={handleConfirmCancel}>
            Yes, cancel listing
          </Button>
        </div>
      </Modal>
    </div>
  )
}
