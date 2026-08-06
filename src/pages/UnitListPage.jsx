import { useParams, Navigate } from 'react-router-dom'
import { getUnits, getPublishers } from '../lib/dataLoader.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import UnitAccordion from '../components/UnitAccordion.jsx'

export default function UnitListPage() {
  const { publisherId } = useParams()
  const { session, logout } = useAuth()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  const publisher = getPublishers().find((p) => p.id === publisherId)
  const units = getUnits(publisherId)

  return (
    <main>
      <header className="unit-list-header">
        <div>
          <p className="school-label">
            {session.schoolName} · {session.studentName}
          </p>
          <h1>{publisher ? publisher.name : publisherId}</h1>
        </div>
        <button type="button" onClick={logout}>
          로그아웃
        </button>
      </header>
      <UnitAccordion publisherId={publisherId} units={units} />
    </main>
  )
}
