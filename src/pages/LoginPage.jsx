import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import schools from '../data/schools.json'
import { matchSchool } from '../lib/auth.js'

export default function LoginPage() {
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? '')
  const [studentName, setStudentName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const school = matchSchool(schools, schoolId, password)
    if (!school) {
      setError('비밀번호가 올바르지 않아요. 다시 확인해 주세요.')
      return
    }
    login({
      schoolId: school.id,
      schoolName: school.name,
      publisherId: school.publisherId,
      studentName,
    })
    navigate(`/p/${school.publisherId}`)
  }

  return (
    <main className="login-page">
      <h1>우리 고장 서천 지역화 자료</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="school">학교</label>
        <select id="school" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>

        <label htmlFor="studentName">이름</label>
        <input
          id="studentName"
          type="text"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="이름을 입력하세요"
        />

        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="학교 비밀번호를 입력하세요"
        />

        <button type="submit">입장하기</button>
        {error && <p role="alert">{error}</p>}
      </form>
      <Link to="/admin/login" className="admin-entry-link">
        관리자 모드
      </Link>
    </main>
  )
}
