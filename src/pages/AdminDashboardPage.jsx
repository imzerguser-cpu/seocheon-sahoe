import { Link, useNavigate } from 'react-router-dom'
import { clearAdminSession, getAdminSession, signOutSuperAdmin } from '../lib/auth.js'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const role = getAdminSession()

  async function handleSignOut() {
    if (role === 'super-admin') {
      await signOutSuperAdmin()
    }
    clearAdminSession()
    navigate('/admin/login')
  }

  return (
    <main className="admin-dashboard-page">
      <h1>관리자 대시보드</h1>
      <nav className="admin-menu">
        <Link to="/admin/materials">자료 관리</Link>
        <Link to="/admin/quizzes">퀴즈 관리</Link>
        {role === 'super-admin' && <Link to="/admin/password">학교관리자 비밀번호 변경</Link>}
      </nav>
      <button type="button" onClick={handleSignOut}>
        로그아웃
      </button>
    </main>
  )
}
