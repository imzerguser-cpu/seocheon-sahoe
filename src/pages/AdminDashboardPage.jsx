import { useNavigate } from 'react-router-dom'
import { clearAdminSession } from '../lib/auth.js'

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  function handleSignOut() {
    clearAdminSession()
    navigate('/admin/login')
  }

  return (
    <main className="admin-dashboard-page">
      <h1>관리자 대시보드</h1>
      <p>
        학교별 비밀번호는 <code>src/data/schools.json</code>, 관리자 비밀번호는{' '}
        <code>src/data/adminConfig.json</code> 파일을 직접 수정해서 관리합니다. 교육과정과 서천
        지역화 자료도 저장소 코드로 직접 관리합니다.
      </p>
      <button type="button" onClick={handleSignOut}>
        로그아웃
      </button>
    </main>
  )
}
