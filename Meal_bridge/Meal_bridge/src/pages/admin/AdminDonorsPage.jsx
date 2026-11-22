import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'
import { useAdmin } from '../../context/AdminContext.jsx'

export default function AdminDonorsPage() {
  const { users } = useAdmin()
  const donors = users.filter((user) => user.role === 'donor')

  return (
    <>
      <PageHeader title="Donors" description="Restaurants, bakeries and caterers posting surplus food." />

      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-cream-100 text-left text-stone-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Organization</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Activity</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {donors.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium text-stone-900">{user.name}</td>
                <td className="px-4 py-3 text-stone-700">{user.organization || '—'}</td>
                <td className="px-4 py-3 text-stone-700">{user.location}</td>
                <td className="px-4 py-3 text-stone-700">{user.activityCount}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={user.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
