import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'
import FoodImage from '../../components/ui/FoodImage.jsx'
import { useVolunteer } from '../../context/VolunteerContext.jsx'
import { formatDateTime, formatQuantity } from '../../lib/formatters.js'

export default function VolunteerCompletedPage() {
  const { tasks } = useVolunteer()
  const deliveries = tasks.filter((task) => task.status === 'Delivered')

  return (
    <>
      <PageHeader title="Completed deliveries" description="Food you have delivered to receiving organisations." />

      {deliveries.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-stone-700">No completed deliveries yet.</p>
          <p className="mt-1 text-sm text-stone-600">Delivered tasks will be listed here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white px-5 shadow-sm">
          {deliveries.map((task) => (
            <li key={task.id} className="flex items-center gap-4 py-4">
              <FoodImage src={task.image} alt={task.foodName} className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-stone-900">{task.foodName}</p>
                <p className="text-sm text-stone-600">
                  {formatQuantity(task.quantity, task.unit)} · {task.receiverOrganization}
                </p>
                <p className="text-xs text-stone-500">Delivered {formatDateTime(task.deliveredAt)}</p>
              </div>
              <StatusBadge status={task.status} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
