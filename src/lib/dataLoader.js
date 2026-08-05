import publishersData from '../data/publishers.json'
import topicsData from '../data/topics.json'
import mappingsData from '../data/mappings.json'
import quizzesData from '../data/quizzes.json'
import { curricula } from '../data/curriculaIndex.js'

export function selectUnits(curriculum) {
  if (!curriculum) return []
  return [...curriculum.units].sort((a, b) => a.order - b.order)
}

export function selectUnit(curriculum, unitId) {
  return selectUnits(curriculum).find((u) => u.id === unitId) ?? null
}

export function selectSubunits(curriculum, unitId) {
  const unit = selectUnit(curriculum, unitId)
  if (!unit) return []
  return [...unit.subunits].sort((a, b) => a.order - b.order)
}

export function selectSubunit(curriculum, unitId, subunitId) {
  return selectSubunits(curriculum, unitId).find((s) => s.id === subunitId) ?? null
}

export function selectLessons(curriculum, unitId, subunitId) {
  const subunit = selectSubunit(curriculum, unitId, subunitId)
  if (!subunit) return []
  return [...subunit.lessons].sort((a, b) => a.order - b.order)
}

export function selectLesson(curriculum, unitId, subunitId, lessonId) {
  return selectLessons(curriculum, unitId, subunitId).find((l) => l.id === lessonId) ?? null
}

export function selectTopicsForLesson(topicList, mappingList, publisherId, lessonId) {
  const topicIds = mappingList
    .filter((m) => m.publisherId === publisherId && m.lessonId === lessonId)
    .map((m) => m.topicId)
  return topicList.filter((t) => topicIds.includes(t.id))
}

export function selectQuizQuestions(quizList, scope, refId) {
  if (scope === 'lesson') {
    const quiz = quizList.find((q) => q.scope === 'lesson' && q.refId === refId)
    return quiz ? quiz.questions : []
  }
  if (scope === 'subunit') {
    return quizList
      .filter((q) => q.scope === 'lesson' && q.parentSubunitId === refId)
      .flatMap((q) => q.questions)
  }
  if (scope === 'unit') {
    return quizList
      .filter((q) => q.scope === 'lesson' && q.parentUnitId === refId)
      .flatMap((q) => q.questions)
  }
  return []
}

export function getPublishers() {
  return publishersData
}

export function getUnits(publisherId) {
  return selectUnits(curricula[publisherId])
}

export function getUnit(publisherId, unitId) {
  return selectUnit(curricula[publisherId], unitId)
}

export function getSubunits(publisherId, unitId) {
  return selectSubunits(curricula[publisherId], unitId)
}

export function getSubunit(publisherId, unitId, subunitId) {
  return selectSubunit(curricula[publisherId], unitId, subunitId)
}

export function getLessons(publisherId, unitId, subunitId) {
  return selectLessons(curricula[publisherId], unitId, subunitId)
}

export function getLesson(publisherId, unitId, subunitId, lessonId) {
  return selectLesson(curricula[publisherId], unitId, subunitId, lessonId)
}

export function getTopicsForLesson(publisherId, lessonId) {
  return selectTopicsForLesson(topicsData, mappingsData, publisherId, lessonId)
}

export function getQuizQuestions(scope, refId) {
  return selectQuizQuestions(quizzesData, scope, refId)
}
