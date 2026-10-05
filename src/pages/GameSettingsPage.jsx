import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import schools from '../data/schools.json'
import { getAdminSession } from '../lib/auth.js'
import { fetchGameSettings, setGameEnabled, isGameEnabled } from '../lib/gameSettingsRepo.js'
import { fullSchoolName } from '../lib/schoolNames.js'

// 학교관리자는 자기 학교만, 전체관리자는 모든 학교의 게임 공개 여부를 바꾼다.
export default function GameSettingsPage() {
  const adminSession = getAdminSession()
  const isSuperAdmin = adminSession?.role === 'super-admin'
  const visibleSchools = isSuperAdmin
    ? schools
    : schools.filter((s) => s.id === adminSession?.schoolId)

  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [savingSchoolId, setSavingSchoolId] = useState(null)
  const [errorSchoolId, setErrorSchoolId] = useState(null)

  useEffect(() => {
    fetchGameSettings()
      .then((data) => {
        setSettings(data)
        setLoading(false)
      })
      .catch(() => {
        setLoadError(true)
        setLoading(false)
      })
  }, [])

  async function handleToggle(schoolId) {
    const next = !isGameEnabled(settings, schoolId)
    setErrorSchoolId(null)
    setSavingSchoolId(schoolId)
    try {
      await setGameEnabled(schoolId, next)
      setSettings((s) => ({ ...s, [schoolId]: next }))
    } catch {
      setErrorSchoolId(schoolId)
    } finally {
      setSavingSchoolId(null)
    }
  }

  return (
    <main className="game-settings-page">
      <Link to="/admin">← 관리자 대시보드</Link>
      <h1>게임 공개 설정</h1>
      <p className="field-hint">
        켜 둔 학교의 학생에게만 대단원 목록 위에 「지식의 성」 게임 버튼이 보여요. 게임 문제는
        퀴즈 관리에서 공개한 객관식·OX 퀴즈로 나와요.
      </p>
      {loading && <p className="empty-state">불러오는 중...</p>}
      {!loading && loadError && <p className="empty-state">설정을 불러오지 못했어요.</p>}
      {!loading && !loadError && (
        <ul className="game-settings-list">
          {visibleSchools.map((school) => {
            const enabled = isGameEnabled(settings, school.id)
            const label = fullSchoolName(school)
            return (
              <li key={school.id}>
                <span className="game-settings-name">{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`${label} 학생에게 게임 보이기`}
                  className={`game-toggle ${enabled ? 'on' : 'off'}`}
                  disabled={savingSchoolId === school.id}
                  onClick={() => handleToggle(school.id)}
                >
                  {enabled ? '켜짐 · 학생에게 보임' : '꺼짐 · 숨김'}
                </button>
                {errorSchoolId === school.id && (
                  <span role="alert" className="game-settings-error">
                    저장하지 못했어요. 다시 시도해 주세요.
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
