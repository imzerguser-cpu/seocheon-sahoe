import { Navigate, Outlet } from 'react-router-dom'
import { getAdminSession } from '../lib/auth.js'

export default function SuperAdminRoute() {
  const role = getAdminSession()
  if (role === 'super-admin') return <Outlet />
  if (role === 'school-admin') return <Navigate to="/admin" replace />
  return <Navigate to="/admin/login" replace />
}
