import { useParams, Link } from 'react-router-dom'
import { getUnit, getSubunit, getLesson, getPublishers, getTopicsForLesson } from '../lib/dataLoader.js'
import UnitBreadcrumb from '../components/UnitBreadcrumb.jsx'
import ResourceCard from '../components/ResourceCard.jsx'

export default function LessonDetailPage() {
  const { publisherId, unitId, subunitId, lessonId } = useParams()
  const publisher = getPublishers().find((p) => p.id === publisherId)
  const unit = getUnit(publisherId, unitId)
  const subunit = getSubunit(publisherId, unitId, subunitId)
  const lesson = getLesson(publisherId, unitId, subunitId, lessonId)
  const topics = getTopicsForLesson(publisherId, lessonId)

  return (
    <main>
      <UnitBreadcrumb
        trail={[
          { href: `/p/${publisherId}`, label: publisher ? publisher.name : publisherId },
          { href: `/p/${publisherId}/${unitId}`, label: unit ? unit.title : unitId },
          { href: `/p/${publisherId}/${unitId}/${subunitId}`, label: subunit ? subunit.title : subunitId },
        ]}
        current={lesson ? lesson.title : lessonId}
      />
      <h1>{lesson ? lesson.title : lessonId}</h1>

      {topics.length === 0 && <p className="empty-state">아직 연결된 서천 지역화 자료가 없어요.</p>}

      {topics.map((topic) => (
        <section key={topic.id} className="topic-block">
          <h2>{topic.차시제목}</h2>
          <p className="topic-usage">{topic.활용법 || '활용 방법을 준비 중입니다.'}</p>
          {topic.resources.length === 0 ? (
            <p className="empty-state">자료 준비 중입니다.</p>
          ) : (
            <div className="resource-list">
              {topic.resources.map((resource, index) => (
                <ResourceCard key={`${topic.id}-${index}`} resource={resource} />
              ))}
            </div>
          )}
        </section>
      ))}

      <Link to={`/quiz/lesson/${lessonId}`} className="quiz-link">
        이 차시 퀴즈 풀기
      </Link>
    </main>
  )
}
