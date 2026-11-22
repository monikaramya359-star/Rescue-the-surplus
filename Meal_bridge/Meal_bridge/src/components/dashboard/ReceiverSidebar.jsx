import {
  Bell,
  Building2,
  ClipboardList,
  History,
  Leaf,
  LayoutDashboard,
  LogOut,
  Search,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useReceiver } from '../../context/ReceiverContext.jsx'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/dashboard/receiver', end: true },
  { label: 'Available Food', icon: Search, path: '/dashboard/receiver/available' },
  { label: 'My Claims', icon: ClipboardList, path: '/dashboard/receiver/claims' },
  { label: 'Delivery History', icon: History, path: '/dashboard/receiver/history' },
  { label: 'Notifications', icon: Bell, path: '/dashboard/receiver/notifications', badge: true },
  { label: 'Organization Profile', icon: Building2, path: '/dashboard/receiver/profile' },
]

export default function ReceiverSidebar({ onNavigate, onLogout }) {
  const { notifications, profile } = useReceiver()
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-stone-200 px-5 py-6">
        <NavLink
          to="/"
          className="flex items-center gap-2 rounded-xl font-display text-lg font-semibold text-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Leaf className="h-5 w-5" aria-hidden="true" />
          </span>
          Rescue the Surplus
        </NavLink>
        <p className="mt-3 truncate text-sm text-stone-600">{profile.organizationName}</p>
      </div>

      <nav aria-label="Receiver dashboard" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navItems.map(({ label, icon: Icon, path, end, badge }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-stone-700 hover:bg-primary-50 hover:text-primary-800'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="flex-1">{label}</span>
            {badge && unreadCount > 0 && (
              <span
                aria-label={`${unreadCount} unread`}
                className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white"
              >
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-stone-200 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Logout
        </button>
      </div>
    </div>
  )
}
