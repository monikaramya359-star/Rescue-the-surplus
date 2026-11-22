import { Bell, BellOff } from 'lucide-react'
import PageHeader from '../../components/dashboard/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import { useDonor } from '../../context/DonorContext.jsx'

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useDonor()
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Updates about your donations and pickups."
        action={
          <Button
            variant="secondary"
            icon={BellOff}
            onClick={markAllNotificationsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        }
      />

      <p className="mb-4 text-sm font-medium text-stone-600">
        {unreadCount === 0 ? 'No unread notifications' : `${unreadCount} unread`}
      </p>

      <ul className="space-y-3">
        {notifications.map((notification) => (
          <li key={notification.id}>
            <button
              type="button"
              onClick={() => {
                if (!notification.read) markNotificationRead(notification.id)
              }}
              aria-label={`${notification.title}${notification.read ? '' : ' (unread)'}`}
              className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                notification.read
                  ? 'border-stone-200 bg-white'
                  : 'border-primary-200 bg-primary-50/60'
              }`}
            >
              <span
                className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  notification.read ? 'bg-stone-100 text-stone-500' : 'bg-primary-100 text-primary-700'
                }`}
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-stone-900">{notification.title}</span>
                  <span className="text-xs text-stone-500">{notification.time}</span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-stone-600">
                  {notification.message}
                </span>
              </span>
              {!notification.read && (
                <span className="mt-2 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                  New
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
