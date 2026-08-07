import publishersData from '../data/publishers.json'
import { curricula } from '../data/curriculaIndex.js'

export function selectUnits(curriculum) {
  if (!curriculum) return []
  return [...curriculum.units].sort((a, b) => a.order - b.order)
}

export function selectUnit(curriculum, unitId) {
  return selectUnits(curriculum).find((u) => u.id === unitId) ?? null
}

export function selectTopics(curriculum, unitId) {
  const unit = selectUnit(curriculum, unitId)
  if (!unit) return []
  return [...unit.topics].sort((a, b) => a.order - b.order)
}

export function selectTopic(curriculum, unitId, topicId) {
  return selectTopics(curriculum, unitId).find((t) => t.id === topicId) ?? null
}

export function selectLessons(curriculum, unitId, topicId) {
  const topic = selectTopic(curriculum, unitId, topicId)
  if (!topic) return []
  return [...topic.lessons].sort((a, b) => a.차시순서 - b.차시순서)
}

export function selectLesson(curriculum, unitId, topicId, lessonId) {
  return selectLessons(curriculum, unitId, topicId).find((l) => l.id === lessonId) ?? null
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

export function getTopics(publisherId, unitId) {
  return selectTopics(curricula[publisherId], unitId)
}

export function getTopic(publisherId, unitId, topicId) {
  return selectTopic(curricula[publisherId], unitId, topicId)
}

export function getLessons(publisherId, unitId, topicId) {
  return selectLessons(curricula[publisherId], unitId, topicId)
}

export function getLesson(publisherId, unitId, topicId, lessonId) {
  return selectLesson(curricula[publisherId], unitId, topicId, lessonId)
}
