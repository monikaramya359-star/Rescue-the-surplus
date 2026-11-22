import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'
import { useAdmin } from '../../context/AdminContext.jsx'
import { formatDateTime } from '../../lib/formatters.js'

export default function AdminPickupsPage() {
  const { pickups } = useAdmin()

  return (
    <>
      <PageHeader title="Pickup monitoring" description="Pickups from claim to delivery, with the assigned volunteer." />

      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-cream-100 text-left text-stone-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Food</th>
              <th className="px-4 py-3 font-semibold">Donor</th>
              <th className="px-4 py-3 font-semibold">Receiver</th>
              <th className="px-4 py-3 font-semibold">Volunteer</th>
              <th className="px-4 py-3 font-semibold">Deadline</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {pickups.map((pickup) => (
              <tr key={pickup.id}>
                <td className="px-4 py-3 font-medium text-stone-900">{pickup.foodName}</td>
                <td className="px-4 py-3 text-stone-700">{pickup.donorName}</td>
                <td className="px-4 py-3 text-stone-700">{pickup.receiverName}</td>
                <td className="px-4 py-3 text-stone-700">{pickup.volunteerName || 'Unassigned'}</td>
                <td className="px-4 py-3 text-stone-700">{formatDateTime(pickup.pickupDeadline)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={pickup.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
