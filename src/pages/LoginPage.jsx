import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import schools from '../data/schools.json'
import { matchSchool } from '../lib/auth.js'
import { fetchSchoolPasswords } from '../lib/schoolPasswordsRepo.js'
import { fullSchoolName } from '../lib/schoolNames.js'

// 지도 이미지(1222×864, public/images/seocheon-map.png) 위 각 학교 아이콘의
// 위치를 이미지 가로/세로에 대한 백분율로 기록한 좌표. (서천초를 포함해)
// 이제 16개 학교 모두 지도 원본 그림에 아이콘이 있다.
const SCHOOL_MAP_POSITIONS = {
  'seomyeon-cho': { x: 15.4, y: 17.1 },
  'seodo-cho': { x: 15.4, y: 27.0 },
  'biin-cho': { x: 29.9, y: 35.9 },
  'oseong-cho': { x: 46.5, y: 32.2 },
  'bunae-cho': { x: 39.5, y: 48.4 },
  'sicho-cho': { x: 61.8, y: 48.4 },
  'masan-cho': { x: 74.1, y: 41.4 },
  'gisan-cho': { x: 65.5, y: 55.3 },
  'hansan-cho': { x: 77.6, y: 58.4 },
  'seocheon-cho': { x: 50.6, y: 59.9 },
  'songseok-cho': { x: 42.4, y: 62.8 },
  'songlim-cho': { x: 50.6, y: 67.5 },
  'madong-cho': { x: 58.5, y: 69.2 },
  'hwayang-cho': { x: 70.0, y: 71.5 },
  'jangang-cho': { x: 47.7, y: 83.1 },
  'jangang-jungang-cho': { x: 55.9, y: 83.1 },
}

export default function LoginPage() {
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? '')
  const [studentName, setStudentName] = useState('')
  const [password, setPassword] = useState('')
  const [isTeacher, setIsTeacher] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const selectedSchool = schools.find((s) => s.id === schoolId)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const passwords = await fetchSchoolPasswords()
    setSubmitting(false)
    const school = matchSchool(schools, schoolId, password, passwords)
    if (!school) {
      setError('비밀번호가 올바르지 않아요. 다시 확인해 주세요.')
      return
    }
    login({
      schoolId: school.id,
      schoolName: fullSchoolName(school),
      publisherId: school.publisherId,
      studentName,
      role: isTeacher ? 'teacher' : 'student',
    })
    navigate(`/p/${school.publisherId}`)
  }

  return (
    <main className="login-page">
      <h1>우리 고장 서천 지역화 자료</h1>
      <form onSubmit={handleSubmit}>
        <fieldset className="school-map-field">
          <legend>학교 (지도에서 우리 학교를 눌러 주세요)</legend>
          <div className="school-map">
            <img
              src={`${import.meta.env.BASE_URL}images/seocheon-map.png`}
              alt="서천군 학교 위치 지도"
              className="school-map-image"
            />
            {schools.map((school) => {
              const pos = SCHOOL_MAP_POSITIONS[school.id]
              if (!pos) return null
              const isSelected = school.id === schoolId
              return (
                <button
                  key={school.id}
                  type="button"
                  className="school-hotspot"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  aria-pressed={isSelected}
                  aria-label={fullSchoolName(school)}
                  onClick={() => setSchoolId(school.id)}
                />
              )
            })}
          </div>
          {selectedSchool && (
            <p className="school-selected-label">
              선택한 학교: {fullSchoolName(selectedSchool)}
            </p>
          )}
        </fieldset>

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

        <label className="teacher-checkbox-label" htmlFor="isTeacher">
          <input
            id="isTeacher"
            type="checkbox"
            checked={isTeacher}
            onChange={(e) => setIsTeacher(e.target.checked)}
          />
          저는 선생님이에요
        </label>

        <button type="submit" disabled={submitting}>
          입장하기
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
      <Link to="/admin/login" className="admin-entry-link">
        관리자 모드
      </Link>
    </main>
  )
}
