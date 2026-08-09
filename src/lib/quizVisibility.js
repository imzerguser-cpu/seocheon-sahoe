import { getTopics, getLessons, resolveRefIdForPublisher } from './dataLoader.js'

// A quiz is visible to students once an admin has published it (status is
// 'published' or missing, for quizzes created before this field existed) and
// nobody has hidden it via the per-quiz visible toggle.
export function isPublishedQuiz(q) {
  return q.visible !== false && q.status !== 'pending'
}

// A quiz created from one publisher's textbook is auto-linked (by curriculum
// pacing order) to the same unit/topic/lesson in every other publisher's
// textbook. The match is resolved live from refId's publisher prefix rather
// than from data stored at creation time, so it applies to every quiz,
// including ones created before this matching existed.
export function refIdForPublisher(question, publisherId) {
  return resolveRefIdForPublisher(question.scope, question.refId, publisherId)
}

// A topic-scoped (or lesson-scoped, via the topic) quiz automatically counts
// as part of its parent unit's quiz set. Selects the questions a student
// should see for a given scope+refId, applying that unit rollup.
export function selectVisibleQuestionsForScope(allQuestions, { publisherId, scope, refId }) {
  const visible = allQuestions.filter(isPublishedQuiz)
  if (scope !== 'unit') {
    return visible.filter(
      (q) => q.scope === scope && refIdForPublisher(q, publisherId) === refId,
    )
  }
  const topics = getTopics(publisherId, refId)
  const topicIds = new Set(topics.map((t) => t.id))
  const lessonIds = new Set(
    topics.flatMap((t) => getLessons(publisherId, refId, t.id).map((l) => l.id)),
  )
  return visible.filter((q) => {
    const matchedRefId = refIdForPublisher(q, publisherId)
    return (
      (q.scope === 'unit' && matchedRefId === refId) ||
      (q.scope === 'topic' && topicIds.has(matchedRefId)) ||
      (q.scope === 'lesson' && lessonIds.has(matchedRefId))
    )
  })
}

// Quizzes a student would find while browsing a topic: the topic's own
// topic-scoped quizzes plus every lesson-scoped quiz for a lesson inside it.
export function selectVisibleQuestionsForTopic(allQuestions, { publisherId, unitId, topicId }) {
  const lessonIds = new Set(getLessons(publisherId, unitId, topicId).map((l) => l.id))
  return allQuestions.filter((q) => {
    if (!isPublishedQuiz(q)) return false
    const matchedRefId = refIdForPublisher(q, publisherId)
    return (
      (q.scope === 'topic' && matchedRefId === topicId) ||
      (q.scope === 'lesson' && lessonIds.has(matchedRefId))
    )
  })
}
