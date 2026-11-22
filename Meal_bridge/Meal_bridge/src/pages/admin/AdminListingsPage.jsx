import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'
import { useAdmin } from '../../context/AdminContext.jsx'
import { formatDateTime, formatQuantity } from '../../lib/formatters.js'

export default function AdminListingsPage() {
  const { listings } = useAdmin()

  return (
    <>
      <PageHeader title="Food listings" description="Every surplus food listing and its current status." />

      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-cream-100 text-left text-stone-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Food</th>
              <th className="px-4 py-3 font-semibold">Donor</th>
              <th className="px-4 py-3 font-semibold">Quantity</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Pickup deadline</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {listings.map((listing) => (
              <tr key={listing.id}>
                <td className="px-4 py-3 font-medium text-stone-900">{listing.foodName}</td>
                <td className="px-4 py-3 text-stone-700">{listing.donorName}</td>
                <td className="px-4 py-3 text-stone-700">{formatQuantity(listing.quantity, listing.unit)}</td>
                <td className="px-4 py-3 text-stone-700">{listing.location}</td>
                <td className="px-4 py-3 text-stone-700">{formatDateTime(listing.pickupDeadline)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={listing.effectiveStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
