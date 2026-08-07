import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import schools from '../data/schools.json'
import { getAdminSession } from '../lib/auth.js'
import {
  fetchSchoolPasswords,
  updateSchoolPassword,
  fetchSchoolAdminPasswords,
  updateSchoolAdminPassword,
} from '../lib/schoolPasswordsRepo.js'
import { fullSchoolName } from '../lib/schoolNames.js'

export default function SchoolPasswordsPage() {
  const adminSession = getAdminSession()
  const isSuperAdmin = adminSession?.role === 'super-admin'
  const visibleSchools = isSuperAdmin
    ? schools
    : schools.filter((s) => s.id === adminSession?.schoolId)

  const [studentPasswords, setStudentPasswords] = useState({})
  const [adminPasswords, setAdminPasswords] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [savedSchoolId, setSavedSchoolId] = useState(null)
  const [saveErrorSchoolId, setSaveErrorSchoolId] = useState(null)

  useEffect(() => {
    // Fetched independently: if one collection has a problem (e.g. a missing
    // Firestore rule), it shouldn't blank out the other password list too.
    Promise.all([
      fetchSchoolPasswords().catch(() => null),
      fetchSchoolAdminPasswords().catch(() => null),
    ]).then(([studentMap, adminMap]) => {
      if (studentMap === null && adminMap === null) {
        setLoadError(true)
      } else {
        setStudentPasswords(studentMap ?? {})
        setAdminPasswords(adminMap ?? {})
      }
      setLoading(false)
    })
  }, [])

  function handleStudentChange(schoolId, value) {
    setSavedSchoolId(null)
    setSaveErrorSchoolId(null)
    setStudentPasswords((p) => ({ ...p, [schoolId]: value }))
  }

  function handleAdminChange(schoolId, value) {
    setSavedSchoolId(null)
    setSaveErrorSchoolId(null)
    setAdminPasswords((p) => ({ ...p, [schoolId]: value }))
  }

  async function handleSave(schoolId) {
    setSaveErrorSchoolId(null)
    const results = await Promise.allSettled([
      updateSchoolPassword(schoolId, studentPasswords[schoolId] ?? ''),
      updateSchoolAdminPassword(schoolId, adminPasswords[schoolId] ?? ''),
    ])
    if (results.every((r) => r.status === 'rejected')) {
      setSaveErrorSchoolId(schoolId)
    } else {
      setSavedSchoolId(schoolId)
    }
  }

  return (
    <main className="school-passwords-page">
      <Link to="/admin" className="back-link">
        ← 관리자 대시보드로
      </Link>
      <h1>{isSuperAdmin ? '학교 비밀번호 관리' : '우리 학교 비밀번호'}</h1>
      <p className="field-hint">
        학생 로그인 비밀번호와 학교관리자(교사) 로그인 비밀번호는 서로 달라야 안전해요.
      </p>
      {loading && <p className="empty-state">불러오는 중...</p>}
      {!loading && loadError && (
        <p className="empty-state">비밀번호를 불러오지 못했어요.</p>
      )}
      {!loading && !loadError && (
        <ul className="school-password-list">
          {visibleSchools.map((school) => (
            <li key={school.id}>
              <span className="school-password-name">{fullSchoolName(school)}</span>
              <label htmlFor={`student-password-${school.id}`}>
                <span className="visually-hidden">{fullSchoolName(school)} </span>
                학생 로그인 비밀번호
              </label>
              <input
                id={`student-password-${school.id}`}
                type="text"
                value={studentPasswords[school.id] ?? ''}
                onChange={(e) => handleStudentChange(school.id, e.target.value)}
              />
              <label htmlFor={`admin-password-${school.id}`}>
                <span className="visually-hidden">{fullSchoolName(school)} </span>
                학교관리자 비밀번호
              </label>
              <input
                id={`admin-password-${school.id}`}
                type="text"
                value={adminPasswords[school.id] ?? ''}
                onChange={(e) => handleAdminChange(school.id, e.target.value)}
              />
              <button type="button" onClick={() => handleSave(school.id)}>
                저장
              </button>
              {savedSchoolId === school.id && <span role="status">저장했어요.</span>}
              {saveErrorSchoolId === school.id && (
                <span role="alert">저장에 실패했어요.</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
