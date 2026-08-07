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

/**
 * 기준(source) 차시와 진도표상 순서(대단원 order, 학습주제 order)가 같은 차시를
 * 나머지 모든 출판사에서 찾는다. 진도표의 학습주제 순서가 출판사 간에도 거의 같은
 * 내용을 다룬다는 전제로, 성취기준이 아닌 순서 기반으로 매칭한다.
 */
export function findMatchingLessonsAcrossPublishers(
  sourcePublisherId,
  sourceUnitId,
  sourceTopicId,
  sourceLessonId,
) {
  const sourceUnit = getUnit(sourcePublisherId, sourceUnitId)
  const sourceTopic = getTopic(sourcePublisherId, sourceUnitId, sourceTopicId)
  const sourceLesson = getLesson(sourcePublisherId, sourceUnitId, sourceTopicId, sourceLessonId)
  if (!sourceUnit || !sourceTopic || !sourceLesson) return []

  const matches = []
  for (const publisher of getPublishers()) {
    if (publisher.id === sourcePublisherId) continue

    const matchedUnit = getUnits(publisher.id).find((u) => u.order === sourceUnit.order)
    if (!matchedUnit) continue

    const matchedTopic = getTopics(publisher.id, matchedUnit.id).find(
      (t) => t.order === sourceTopic.order,
    )
    if (!matchedTopic) continue

    const targetLessons = getLessons(publisher.id, matchedUnit.id, matchedTopic.id)
    if (targetLessons.length === 0) continue

    const matchedLesson =
      targetLessons.find((l) => l.차시순서 === sourceLesson.차시순서) ??
      targetLessons[targetLessons.length - 1]

    matches.push({
      publisherId: publisher.id,
      unitId: matchedUnit.id,
      topicId: matchedTopic.id,
      lessonId: matchedLesson.id,
    })
  }
  return matches
}
