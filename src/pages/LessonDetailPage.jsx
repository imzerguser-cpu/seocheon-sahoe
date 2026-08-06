import { useParams, Link, Navigate } from 'react-router-dom'
import {
  getUnit,
  getTopic,
  getLessons,
  getLesson,
  getSeocheonTopicsForLesson,
} from '../lib/dataLoader.js'
import ResourceCard from '../components/ResourceCard.jsx'

export default function LessonDetailPage() {
  const { publisherId, unitId, topicId, lessonId } = useParams()
  const unit = getUnit(publisherId, unitId)
  const topic = getTopic(publisherId, unitId, topicId)
  const lessons = getLessons(publisherId, unitId, topicId)
  const lesson = getLesson(publisherId, unitId, topicId, lessonId)
  const seocheonTopics = getSeocheonTopicsForLesson(publisherId, lessonId)

  if (!lesson) {
    return <Navigate to={`/p/${publisherId}`} replace />
  }

  const currentIndex = lessons.findIndex((l) => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  const lessonPath = (target) => `/p/${publisherId}/${unitId}/${topicId}/${target.id}`

  return (
    <main className="lesson-detail-page">
      <Link to={`/p/${publisherId}`} className="back-link">
        ← 대단원 목록으로
      </Link>
      <p className="unit-label">{unit ? unit.title : unitId}</p>
      <h1 className="topic-title">{topic ? topic.title : topicId}</h1>
      <p className="lesson-meta">
        {lesson.차시순서} / {lesson.전체차시}차시 · {lesson.쪽수}쪽
      </p>
      {lesson.성취기준.length > 0 && (
        <ul className="standards-list">
          {lesson.성취기준.map((standard) => (
            <li key={standard}>{standard}</li>
          ))}
        </ul>
      )}

      <nav className="lesson-nav">
        {prevLesson && (
          <Link to={lessonPath(prevLesson)}>◀ 이전 차시</Link>
        )}
        {nextLesson && (
          <Link to={lessonPath(nextLesson)}>다음 차시 ▶</Link>
        )}
      </nav>

      {seocheonTopics.length === 0 && (
        <p className="empty-state">아직 연결된 서천 지역화 자료가 없어요.</p>
      )}

      {seocheonTopics.map((seocheonTopic) => (
        <section key={seocheonTopic.id} className="topic-block">
          <h2>{seocheonTopic.차시제목}</h2>
          <p className="topic-usage">{seocheonTopic.활용법 || '활용 방법을 준비 중입니다.'}</p>
          {seocheonTopic.resources.length === 0 ? (
            <p className="empty-state">자료 준비 중입니다.</p>
          ) : (
            <div className="resource-list">
              {seocheonTopic.resources.map((resource, index) => (
                <ResourceCard key={`${seocheonTopic.id}-${index}`} resource={resource} />
              ))}
            </div>
          )}
        </section>
      ))}

      <div className="quiz-links">
        <Link to={`/quiz/lesson/${lessonId}`} className="quiz-link">
          이 차시 퀴즈
        </Link>
        <Link to={`/quiz/topic/${topicId}`} className="quiz-link">
          이 학습주제 퀴즈
        </Link>
        <Link to={`/quiz/unit/${unitId}`} className="quiz-link">
          이 대단원 퀴즈
        </Link>
      </div>
    </main>
  )
}
