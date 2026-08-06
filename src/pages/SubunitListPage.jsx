import { Link, useParams } from 'react-router-dom'
import { getSubunits, getUnit, getPublishers } from '../lib/dataLoader.js'
import EntityCardList from '../components/EntityCardList.jsx'
import UnitBreadcrumb from '../components/UnitBreadcrumb.jsx'

export default function SubunitListPage() {
  const { publisherId, unitId } = useParams()
  const publisher = getPublishers().find((p) => p.id === publisherId)
  const unit = getUnit(publisherId, unitId)
  const subunits = getSubunits(publisherId, unitId)

  return (
    <main>
      <UnitBreadcrumb
        trail={[{ href: `/p/${publisherId}`, label: publisher ? publisher.name : publisherId }]}
        current={unit ? unit.title : unitId}
      />
      <h1>{unit ? unit.title : unitId} — 소단원</h1>
      <EntityCardList
        items={subunits}
        getHref={(subunit) => `/p/${publisherId}/${unitId}/${subunit.id}`}
        emptyMessage="아직 등록된 소단원이 없어요."
      />
      <Link to={`/quiz/unit/${unitId}`} className="quiz-link">
        이 대단원 퀴즈 풀기
      </Link>
    </main>
  )
}
