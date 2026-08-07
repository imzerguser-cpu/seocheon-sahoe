import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getUnit, getTopic, getLessons, getLesson } from '../lib/dataLoader.js'
import { fetchMaterialsForLesson } from '../lib/materialsRepo.js'
import { fetchQuestions } from '../lib/quizzesRepo.js'
import ResourceCard from '../components/ResourceCard.jsx'

export default function LessonDetailPage() {
  const { publisherId, unitId, topicId, lessonId } = useParams()
  const unit = getUnit(publisherId, unitId)
  const topic = getTopic(publisherId, unitId, topicId)
  const lessons = getLessons(publisherId, unitId, topicId)
  const lesson = getLesson(publisherId, unitId, topicId, lessonId)

  const [materials, setMaterials] = useState([])
  const [materialsLoading, setMaterialsLoading] = useState(true)
  const [materialsError, setMaterialsError] = useState(false)
  const [quizScopes, setQuizScopes] = useState([])

  useEffect(() => {
    if (!lesson) return

    let ignore = false

    setMaterialsLoading(true)
    setMaterialsError(false)
    setQuizScopes([])

    fetchMaterialsForLesson(lessonId)
      .then((list) => {
        if (!ignore) setMaterials(list)
      })
      .catch(() => {
        if (!ignore) setMaterialsError(true)
      })
      .finally(() => {
        if (!ignore) setMaterialsLoading(false)
      })

    Promise.all([
      fetchQuestions('lesson', lessonId),
      fetchQuestions('topic', topicId),
      fetchQuestions('unit', unitId),
    ])
      .then(([lessonQuestions, topicQuestions, unitQuestions]) => {
        const scopes = []
        if (lessonQuestions.length > 0) scopes.push('lesson')
        if (topicQuestions.length > 0) scopes.push('topic')
        if (unitQuestions.length > 0) scopes.push('unit')
        if (!ignore) setQuizScopes(scopes)
      })
      .catch(() => {
        if (!ignore) setQuizScopes([])
      })

    return () => {
      ignore = true
    }
  }, [lessonId, topicId, unitId, lesson])

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
        {prevLesson && <Link to={lessonPath(prevLesson)}>◀ 이전 차시</Link>}
        {nextLesson && <Link to={lessonPath(nextLesson)}>다음 차시 ▶</Link>}
      </nav>

      {materialsLoading && <p className="empty-state">자료를 불러오는 중...</p>}
      {!materialsLoading && materialsError && (
        <p className="empty-state">자료를 불러오지 못했어요.</p>
      )}
      {!materialsLoading && !materialsError && materials.length === 0 && (
        <p className="empty-state">아직 연결된 서천 지역화 자료가 없어요.</p>
      )}

      {!materialsLoading &&
        !materialsError &&
        materials.map((material) => (
          <section key={material.id} className="topic-block">
            <h2>{material.title}</h2>
            <p className="topic-usage">{material.usageNote || '활용 방법을 준비 중입니다.'}</p>
            {material.resources.length === 0 ? (
              <p className="empty-state">자료 준비 중입니다.</p>
            ) : (
              <div className="resource-list">
                {material.resources.map((resource, index) => (
                  <ResourceCard key={`${material.id}-${index}`} resource={resource} />
                ))}
              </div>
            )}
          </section>
        ))}

      <div className="quiz-links">
        {quizScopes.includes('lesson') && (
          <Link to={`/quiz/lesson/${lessonId}`} className="quiz-link">
            이 차시 퀴즈
          </Link>
        )}
        {quizScopes.includes('topic') && (
          <Link to={`/quiz/topic/${topicId}`} className="quiz-link">
            이 학습주제 퀴즈
          </Link>
        )}
        {quizScopes.includes('unit') && (
          <Link to={`/quiz/unit/${unitId}`} className="quiz-link">
            이 대단원 퀴즈
          </Link>
        )}
      </div>
    </main>
  )
}
