import { Navigate, Outlet } from 'react-router-dom'
import { getAdminSession } from '../lib/auth.js'

export default function SuperAdminRoute() {
  const session = getAdminSession()
  if (session?.role === 'super-admin') return <Outlet />
  if (session?.role === 'school-admin') return <Navigate to="/admin" replace />
  return <Navigate to="/admin/login" replace />
}
