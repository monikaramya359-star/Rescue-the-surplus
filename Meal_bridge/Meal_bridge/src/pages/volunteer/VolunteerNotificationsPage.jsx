import PageHeader from '../../components/dashboard/PageHeader.jsx'
import { useVolunteer } from '../../context/VolunteerContext.jsx'

export default function VolunteerNotificationsPage() {
  const { notifications } = useVolunteer()

  return (
    <>
      <PageHeader title="Notifications" description="Updates about pickups and deliveries." />

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-stone-700">No notifications.</p>
          <p className="mt-1 text-sm text-stone-600">You are all caught up.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${
                notification.read ? 'border-stone-200' : 'border-primary-200 bg-primary-50/40'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="font-semibold text-stone-900">{notification.title}</p>
                <span className="shrink-0 text-xs text-stone-500">{notification.time}</span>
              </div>
              <p className="mt-1 text-sm text-stone-600">{notification.message}</p>
              {!notification.read && <p className="mt-2 text-xs font-semibold text-primary-700">Unread</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
