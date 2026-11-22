import { useState } from 'react'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import StatusBadge from '../../components/dashboard/StatusBadge.jsx'
import Button from '../../components/ui/Button.jsx'
import FoodImage from '../../components/ui/FoodImage.jsx'
import { useVolunteer } from '../../context/VolunteerContext.jsx'
import { formatDateTime, formatQuantity } from '../../lib/formatters.js'

export default function VolunteerTasksPage() {
  const { tasks, markCollected, markDelivered } = useVolunteer()
  const [pendingId, setPendingId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const activeTasks = tasks.filter((task) => task.status !== 'Delivered')

  const nextActions = {
    'Pickup Assigned': { label: 'Mark collected', run: markCollected },
    Collected: { label: 'Mark delivered', run: markDelivered },
  }

  async function runTaskAction(task, run) {
    setPendingId(task.id)
    setActionError(null)
    try {
      const result = await run(task.id)
      if (result && !result.ok) {
        setActionError({ taskId: task.id, message: result.error || 'Could not update this task. Try again.' })
      }
    } catch (error) {
      setActionError({ taskId: task.id, message: error?.message || 'Could not update this task. Try again.' })
    } finally {
      setPendingId(null)
    }
  }

  return (
    <>
      <PageHeader title="My tasks" description="Pickups you have accepted that are not delivered yet." />

      {activeTasks.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-stone-700">No active tasks.</p>
          <p className="mt-1 text-sm text-stone-600">Accepted pickups will show here until they are delivered.</p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white px-5 shadow-sm">
          {activeTasks.map((task) => {
            const next = nextActions[task.status]
            return (
              <li key={task.id} className="flex items-center gap-4 py-4">
                <FoodImage src={task.image} alt={task.foodName} className="h-14 w-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-stone-900">{task.foodName}</p>
                  <p className="text-sm text-stone-600">
                    {formatQuantity(task.quantity, task.unit)} · {task.pickupLocation}
                  </p>
                  <p className="text-xs text-stone-500">
                    Deliver to {task.receiverOrganization} · Pickup by {formatDateTime(task.pickupDeadline)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusBadge status={task.status} />
                  {next && (
                    <Button onClick={() => runTaskAction(task, next.run)} disabled={pendingId === task.id}>
                      {next.label}
                    </Button>
                  )}
                  {actionError?.taskId === task.id && (
                    <p role="alert" className="text-xs text-red-700">
                      {actionError.message}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
