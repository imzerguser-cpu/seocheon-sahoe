import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getTopics, getLessons } from '../lib/dataLoader.js'

export default function UnitAccordion({ publisherId, units }) {
  const [openUnitId, setOpenUnitId] = useState(null)

  if (units.length === 0) {
    return <p className="empty-state">아직 등록된 대단원이 없어요.</p>
  }

  return (
    <div className="unit-accordion">
      {units.map((unit) => {
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
                  return (
                    <li key={topic.id}>
                      <Link
                        to={`/p/${publisherId}/${unit.id}/${topic.id}/${firstLessonId}`}
                        className="topic-link"
                      >
                        <span className="topic-title">{topic.title}</span>
                        <span className="topic-badge">{lessons.length}차시</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
