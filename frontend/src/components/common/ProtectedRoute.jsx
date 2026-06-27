import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner full />

  if (!user) return <Navigate to="/login" replace />

  if (role && user.role !== role) {
    // Redirect to their own dashboard
    return <Navigate to={`/${user.role}`} replace />
  }

  return <Outlet />
}
