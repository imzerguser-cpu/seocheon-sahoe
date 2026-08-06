import { Link, useParams } from 'react-router-dom'
import { getLessons, getUnit, getSubunit, getPublishers } from '../lib/dataLoader.js'
import EntityCardList from '../components/EntityCardList.jsx'
import UnitBreadcrumb from '../components/UnitBreadcrumb.jsx'

export default function LessonListPage() {
  const { publisherId, unitId, subunitId } = useParams()
  const publisher = getPublishers().find((p) => p.id === publisherId)
  const unit = getUnit(publisherId, unitId)
  const subunit = getSubunit(publisherId, unitId, subunitId)
  const lessons = getLessons(publisherId, unitId, subunitId)

  return (
    <main>
      <UnitBreadcrumb
        trail={[
          { href: `/p/${publisherId}`, label: publisher ? publisher.name : publisherId },
          { href: `/p/${publisherId}/${unitId}`, label: unit ? unit.title : unitId },
        ]}
        current={subunit ? subunit.title : subunitId}
      />
      <h1>{subunit ? subunit.title : subunitId} — 차시</h1>
      <EntityCardList
        items={lessons}
        getHref={(lesson) => `/p/${publisherId}/${unitId}/${subunitId}/${lesson.id}`}
        emptyMessage="아직 등록된 차시가 없어요."
      />
      <Link to={`/quiz/subunit/${subunitId}`} className="quiz-link">
        이 소단원 퀴즈 풀기
      </Link>
    </main>
  )
}
