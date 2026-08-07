import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTopics, getLessons } from '../lib/dataLoader.js'
import { fetchAllMaterials } from '../lib/materialsRepo.js'
import { fetchAllQuestions } from '../lib/quizzesRepo.js'
import { selectVisibleQuestionsForTopic } from '../lib/quizVisibility.js'

export default function UnitAccordion({ publisherId, units }) {
  const [openUnitId, setOpenUnitId] = useState(null)
  const [publishedMaterials, setPublishedMaterials] = useState([])
  const [allQuestions, setAllQuestions] = useState([])

  useEffect(() => {
    fetchAllMaterials()
      .then((list) => setPublishedMaterials(list.filter((m) => m.status === 'published')))
      .catch(() => setPublishedMaterials([]))
    fetchAllQuestions()
      .then((list) => setAllQuestions(list))
      .catch(() => setAllQuestions([]))
  }, [])

  function materialsCountForTopic(unitId, topicId) {
    const lessonIds = getLessons(publisherId, unitId, topicId).map((l) => l.id)
    return publishedMaterials.filter((m) =>
      (m.lessonRefs ?? []).some(
        (ref) => ref.publisherId === publisherId && lessonIds.includes(ref.lessonId),
      ),
    ).length
  }

  function contentCountForTopic(unitId, topicId) {
    const quizCount = selectVisibleQuestionsForTopic(allQuestions, {
      publisherId,
      unitId,
      topicId,
    }).length
    return materialsCountForTopic(unitId, topicId) + quizCount
  }

  if (units.length === 0) {
    return <p className="empty-state">아직 등록된 대단원이 없어요.</p>
  }

  const semesterGroups = [1, 2]
    .map((semester) => ({ semester, units: units.filter((unit) => unit.semester === semester) }))
    .filter((group) => group.units.length > 0)

  const renderUnit = (unit) => {
    const isOpen = unit.id === openUnitId
    const topics = isOpen ? getTopics(publisherId, unit.id) : []

    return (
      <div key={unit.id} className="unit-accordion-item">
        <button
          type="button"
          className="unit-accordion-header"
          aria-expanded={isOpen}
          onClick={() => setOpenUnitId(isOpen ? null : unit.id)}
        >
          {unit.title}
        </button>
        {isOpen && (
          <ul className="topic-list">
            {topics.map((topic) => {
              const lessons = getLessons(publisherId, unit.id, topic.id)
              const firstLessonId = lessons[0]?.id
              const contentCount = contentCountForTopic(unit.id, topic.id)
              return (
                <li key={topic.id}>
                  <Link
                    to={`/p/${publisherId}/${unit.id}/${topic.id}/${firstLessonId}`}
                    className="topic-link"
                  >
                    <span className="topic-link-title">
                      {topic.title}
                      {contentCount > 0 && (
                        <span className="topic-materials-count"> ({contentCount})</span>
                      )}
                    </span>
                    <span className="topic-badge">{lessons.length}차시</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="unit-accordion">
      {semesterGroups.map((group) => (
        <section key={group.semester} className="semester-group">
          <h2 className="semester-heading">{group.semester}학기</h2>
          <div className="unit-accordion-list">{group.units.map(renderUnit)}</div>
        </section>
      ))}
    </div>
  )
}
