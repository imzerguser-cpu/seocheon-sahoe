import { getTopics, getLessons } from './dataLoader.js'

// A quiz is visible to students once an admin has published it (status is
// 'published' or missing, for quizzes created before this field existed) and
// nobody has hidden it via the per-quiz visible toggle.
export function isPublishedQuiz(q) {
  return q.visible !== false && q.status !== 'pending'
}

// A topic-scoped (or lesson-scoped, via the topic) quiz automatically counts
// as part of its parent unit's quiz set. Selects the questions a student
// should see for a given scope+refId, applying that unit rollup.
export function selectVisibleQuestionsForScope(allQuestions, { publisherId, scope, refId }) {
  const visible = allQuestions.filter(isPublishedQuiz)
  if (scope !== 'unit') {
    return visible.filter((q) => q.scope === scope && q.refId === refId)
  }
  const topics = getTopics(publisherId, refId)
  const topicIds = new Set(topics.map((t) => t.id))
  const lessonIds = new Set(
    topics.flatMap((t) => getLessons(publisherId, refId, t.id).map((l) => l.id)),
  )
  return visible.filter(
    (q) =>
      (q.scope === 'unit' && q.refId === refId) ||
      (q.scope === 'topic' && topicIds.has(q.refId)) ||
      (q.scope === 'lesson' && lessonIds.has(q.refId)),
  )
}

// Quizzes a student would find while browsing a topic: the topic's own
// topic-scoped quizzes plus every lesson-scoped quiz for a lesson inside it.
export function selectVisibleQuestionsForTopic(allQuestions, { publisherId, unitId, topicId }) {
  const lessonIds = new Set(getLessons(publisherId, unitId, topicId).map((l) => l.id))
  return allQuestions.filter(
    (q) =>
      isPublishedQuiz(q) &&
      ((q.scope === 'topic' && q.refId === topicId) ||
        (q.scope === 'lesson' && lessonIds.has(q.refId))),
  )
}
