import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSchoolAdminPasswords } from '../lib/schoolPasswordsRepo.js'
import { saveAdminSession, signInSuperAdmin } from '../lib/auth.js'
import { fullSchoolName } from '../lib/schoolNames.js'
import schools from '../data/schools.json'

export default function AdminLoginPage() {
  const [tab, setTab] = useState('school')
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? '')
  const [teacherName, setTeacherName] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  function switchTab(nextTab) {
    setTab(nextTab)
    setError('')
    setPassword('')
    setEmail('')
  }

  async function handleSchoolSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const adminPasswords = await fetchSchoolAdminPasswords()
    setSubmitting(false)
    if (!password || password !== adminPasswords[schoolId]) {
      setError('비밀번호가 올바르지 않아요. 다시 확인해 주세요.')
      return
    }
    const school = schools.find((s) => s.id === schoolId)
    saveAdminSession({
      role: 'school-admin',
      schoolId,
      schoolName: school ? fullSchoolName(school) : schoolId,
      teacherName,
    })
    navigate('/admin')
  }

  async function handleSuperSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const success = await signInSuperAdmin(email, password)
    setSubmitting(false)
    if (!success) {
      setError('로그인에 실패했어요. 이메일과 비밀번호를 확인해 주세요.')
      return
    }
    saveAdminSession({ role: 'super-admin' })
    navigate('/admin')
  }

  return (
    <main className="admin-login-page">
      <h1>관리자 로그인</h1>
      <div className="admin-login-tabs">
        <button
          type="button"
          className={tab === 'school' ? 'active' : ''}
          onClick={() => switchTab('school')}
        >
          학교관리자
        </button>
        <button
          type="button"
          className={tab === 'super' ? 'active' : ''}
          onClick={() => switchTab('super')}
        >
          전체관리자
        </button>
      </div>

      {tab === 'school' && (
        <form onSubmit={handleSchoolSubmit}>
          <label htmlFor="admin-school">학교</label>
          <select id="admin-school" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {fullSchoolName(school)}
              </option>
            ))}
          </select>
          <label htmlFor="admin-teacher-name">담당자 이름</label>
          <input
            id="admin-teacher-name"
            type="text"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
          />
          <label htmlFor="admin-password">비밀번호</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={submitting}>
            로그인
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}

      {tab === 'super' && (
        <form onSubmit={handleSuperSubmit}>
          <label htmlFor="admin-email">이메일</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="admin-password">비밀번호</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={submitting}>
            로그인
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
    </main>
  )
}
