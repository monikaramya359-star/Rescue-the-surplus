import {
  Bike,
  Building2,
  FileBarChart,
  Leaf,
  LayoutDashboard,
  LogOut,
  Package,
  Store,
  Truck,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/admin', end: true },
  { label: 'Donors', icon: Store, path: '/admin/donors' },
  { label: 'Receivers', icon: Building2, path: '/admin/receivers' },
  { label: 'Volunteers', icon: Bike, path: '/admin/volunteers' },
  { label: 'Food Listings', icon: Package, path: '/admin/listings' },
  { label: 'Pickup Monitoring', icon: Truck, path: '/admin/pickups' },
  { label: 'Reports', icon: FileBarChart, path: '/admin/reports' },
]

export default function AdminSidebar({ onNavigate, onLogout }) {
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
        <p className="mt-3 truncate text-sm text-stone-600">Admin console</p>
      </div>

      <nav aria-label="Admin dashboard" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navItems.map(({ label, icon: Icon, path, end }) => (
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
