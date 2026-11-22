import {
  Bell,
  ClipboardList,
  History,
  Leaf,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  UserCircle,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useDonor } from '../../context/DonorContext.jsx'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/dashboard/donor', end: true },
  { label: 'Add Food', icon: PlusCircle, path: '/dashboard/donor/add' },
  { label: 'My Donations', icon: ClipboardList, path: '/dashboard/donor/donations' },
  { label: 'Donation History', icon: History, path: '/dashboard/donor/history' },
  { label: 'Notifications', icon: Bell, path: '/dashboard/donor/notifications', badge: true },
  { label: 'Profile', icon: UserCircle, path: '/dashboard/donor/profile' },
]

export default function DashboardSidebar({ onNavigate, onLogout }) {
  const { notifications, profile } = useDonor()
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
        <p className="mt-3 truncate text-sm text-stone-600">{profile.restaurantName}</p>
      </div>

      <nav aria-label="Donor dashboard" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
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
