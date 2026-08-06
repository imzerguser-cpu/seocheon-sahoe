import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase.js'

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut(auth)
    navigate('/admin/login')
  }

  return (
    <main className="admin-dashboard-page">
      <h1>관리자 대시보드</h1>
      <p>
        교사/학생 비밀번호와 관리자 계정 비밀번호는 Firebase 콘솔에서 직접 관리합니다. 콘텐츠(JSON
        데이터)는 저장소 코드로 직접 관리합니다.
      </p>
      <button type="button" onClick={handleSignOut}>
        로그아웃
      </button>
    </main>
  )
}
