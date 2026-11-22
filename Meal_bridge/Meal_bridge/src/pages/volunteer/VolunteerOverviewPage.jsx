import { CheckCircle2, ClipboardList, Truck, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatCard from '../../components/dashboard/StatCard.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'
import FoodImage from '../../components/ui/FoodImage.jsx'
import { useVolunteer } from '../../context/VolunteerContext.jsx'
import { formatQuantity } from '../../lib/formatters.js'

export default function VolunteerOverviewPage() {
  const { tasks, stats } = useVolunteer()
  const recent = tasks.slice(0, 3)

  return (
    <>
      <PageHeader title="Overview" description="Your pickup and delivery activity at a glance." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Truck} label="Available pickups" value={stats.availablePickupTasks} />
        <StatCard icon={ClipboardList} label="Assigned tasks" value={stats.assignedTasks} />
        <StatCard icon={CheckCircle2} label="Completed deliveries" value={stats.completedDeliveries} />
        <StatCard
          icon={Utensils}
          label="Meals delivered"
          value={stats.mealsDelivered}
          hint="Counted from meal deliveries only"
        />
      </div>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-semibold text-primary-800">Recent tasks</h2>
          <Link
            to="/dashboard/volunteer/tasks"
            className="text-sm font-semibold text-primary-700 hover:text-primary-800"
          >
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="mt-6 rounded-xl bg-cream-100 p-8 text-center">
            <p className="font-medium text-stone-700">No tasks yet.</p>
            <p className="mt-1 text-sm text-stone-600">Accept a pickup to start your first task.</p>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-stone-100">
            {recent.map((task) => (
              <li key={task.id} className="flex items-center gap-4 py-4">
                <FoodImage src={task.image} alt={task.foodName} className="h-14 w-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-stone-900">{task.foodName}</p>
                  <p className="text-sm text-stone-600">
                    {formatQuantity(task.quantity, task.unit)} · {task.receiverOrganization}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
