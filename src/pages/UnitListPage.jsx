import { useParams } from 'react-router-dom'
import { getUnits, getPublishers } from '../lib/dataLoader.js'
import EntityCardList from '../components/EntityCardList.jsx'
import UnitBreadcrumb from '../components/UnitBreadcrumb.jsx'

export default function UnitListPage() {
  const { publisherId } = useParams()
  const publisher = getPublishers().find((p) => p.id === publisherId)
  const units = getUnits(publisherId)

  return (
    <main>
      <UnitBreadcrumb trail={[]} current={publisher ? publisher.name : publisherId} />
      <h1>{publisher ? publisher.name : publisherId} — 대단원</h1>
      <EntityCardList
        items={units}
        getHref={(unit) => `/p/${publisherId}/${unit.id}`}
        emptyMessage="아직 등록된 대단원이 없어요."
      />
    </main>
  )
}
