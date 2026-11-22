import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, profile, loading } = useAuth()

  if (loading) {
    return <p className="py-16 text-center text-stone-600">Loading your account...</p>
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && profile?.role !== role) return <Navigate to="/" replace />
  if (profile?.accountStatus === 'Suspended') return <Navigate to="/login" replace />

  return children ?? <Outlet />
}
