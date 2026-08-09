import { Link, useNavigate } from 'react-router-dom'
import { clearAdminSession, getAdminSession, signOutSuperAdmin } from '../lib/auth.js'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const session = getAdminSession()
  const role = session?.role

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
      {role === 'school-admin' && session?.schoolName && (
        <p className="school-label">
          {session.schoolName} · {session.teacherName}
        </p>
      )}
      <nav className="admin-menu">
        <Link to="/admin/materials">자료 관리</Link>
        <Link to="/admin/quizzes">퀴즈 관리</Link>
        <Link to="/admin/school-passwords">
          {role === 'super-admin' ? '학교 비밀번호 관리' : '우리 학교 비밀번호'}
        </Link>
        {role === 'super-admin' && <Link to="/admin/materials/review">검토 대기 자료</Link>}
        <Link to="/admin/quizzes/review">검토 대기 퀴즈</Link>
        {role === 'super-admin' && (
          <Link to="/admin/super-admin-password">전체관리자 비밀번호 변경</Link>
        )}
      </nav>
      <button type="button" onClick={handleSignOut}>
        로그아웃
      </button>
    </main>
  )
}
