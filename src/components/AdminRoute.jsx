import { Navigate, Outlet } from 'react-router-dom'
import { getAdminSession } from '../lib/auth.js'

export default function AdminRoute() {
  if (!getAdminSession()) return <Navigate to="/admin/login" replace />
  return <Outlet />
}
