import { useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'
import Button from '../../components/ui/Button.jsx'
import FoodImage from '../../components/ui/FoodImage.jsx'
import { useVolunteer } from '../../context/VolunteerContext.jsx'
import { formatDateTime, formatQuantity } from '../../lib/formatters.js'

export default function VolunteerPickupsPage() {
  const { pickups, acceptPickup } = useVolunteer()
  const [actionError, setActionError] = useState(null)

  async function handleAccept(pickup) {
    setActionError(null)
    const result = await acceptPickup(pickup.id)
    if (result && !result.ok) {
      setActionError({ pickupId: pickup.id, message: result.error || 'Could not accept this pickup.' })
    }
  }

  return (
    <>
      <PageHeader
        title="Available pickups"
        description="Surplus food waiting for a volunteer. Pickups past their deadline are marked expired."
      />

      {pickups.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-stone-700">No pickups available right now.</p>
          <p className="mt-1 text-sm text-stone-600">New pickups will appear here when donors post food nearby.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pickups.map((pickup) => (
            <li
              key={pickup.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
            >
              <FoodImage src={pickup.image} alt={pickup.foodName} className="h-40 w-full" />
              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-stone-900">{pickup.foodName}</p>
                  <StatusBadge status={pickup.expired ? 'Expired' : 'Active'} />
                </div>
                <p className="text-sm text-stone-600">
                  {formatQuantity(pickup.quantity, pickup.unit)} from {pickup.donorName}
                </p>
                <p className="text-sm text-stone-600">Pick up: {pickup.pickupLocation}</p>
                <p className="text-sm text-stone-600">
                  Deliver to: {pickup.receiverOrganization}, {pickup.receiverLocation}
                </p>
                <p className="mt-auto pt-2 text-xs text-stone-500">
                  {pickup.distanceKm} km away · Pickup by {formatDateTime(pickup.pickupDeadline)}
                </p>
                <Button onClick={() => handleAccept(pickup)} disabled={pickup.expired}>
                  Accept pickup
                </Button>
                {actionError?.pickupId === pickup.id && (
                  <p role="alert" className="text-xs text-red-700">
                    {actionError.message}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
