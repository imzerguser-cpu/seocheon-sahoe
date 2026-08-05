import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase.js'

export default function AdminRoute() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setStatus(user ? 'authed' : 'anonymous')
    })
    return unsubscribe
  }, [])

  if (status === 'loading') return <p>확인 중...</p>
  if (status === 'anonymous') return <Navigate to="/admin/login" replace />
  return <Outlet />
}
