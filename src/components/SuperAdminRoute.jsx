import { Navigate, Outlet } from 'react-router-dom'
import { getAdminSession } from '../lib/auth.js'

export default function SuperAdminRoute() {
  if (getAdminSession() !== 'super-admin') return <Navigate to="/admin/login" replace />
  return <Outlet />
}
