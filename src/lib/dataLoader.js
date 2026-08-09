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

// 기준 대단원과 순서(order)가 같은 대단원을 나머지 모든 출판사에서 찾는다.
export function findMatchingUnitsAcrossPublishers(sourcePublisherId, sourceUnitId) {
  const sourceUnit = getUnit(sourcePublisherId, sourceUnitId)
  if (!sourceUnit) return []

  const matches = []
  for (const publisher of getPublishers()) {
    if (publisher.id === sourcePublisherId) continue
    const matchedUnit = getUnits(publisher.id).find((u) => u.order === sourceUnit.order)
    if (!matchedUnit) continue
    matches.push({ publisherId: publisher.id, unitId: matchedUnit.id })
  }
  return matches
}

// 기준 학습주제와 대단원 order·학습주제 order가 같은 학습주제를 나머지 모든
// 출판사에서 찾는다.
export function findMatchingTopicsAcrossPublishers(sourcePublisherId, sourceUnitId, sourceTopicId) {
  const sourceUnit = getUnit(sourcePublisherId, sourceUnitId)
  const sourceTopic = getTopic(sourcePublisherId, sourceUnitId, sourceTopicId)
  if (!sourceUnit || !sourceTopic) return []

  const matches = []
  for (const publisher of getPublishers()) {
    if (publisher.id === sourcePublisherId) continue
    const matchedUnit = getUnits(publisher.id).find((u) => u.order === sourceUnit.order)
    if (!matchedUnit) continue
    const matchedTopic = getTopics(publisher.id, matchedUnit.id).find(
      (t) => t.order === sourceTopic.order,
    )
    if (!matchedTopic) continue
    matches.push({ publisherId: publisher.id, unitId: matchedUnit.id, topicId: matchedTopic.id })
  }
  return matches
}

/**
 * 퀴즈의 scope(lesson/topic/unit)에 맞춰, 기준 출판사를 포함한 모든 출판사의
 * refId 목록을 반환한다. 학생/교사가 어느 출판사 교과서로 퀴즈를 만들거나 보든
 * 진도표상 같은 순서의 학습주제·차시라면 같은 퀴즈가 보이도록 하기 위함이다.
 */
export function findMatchingRefsAcrossPublishers(sourcePublisherId, scope, { unitId, topicId, lessonId }) {
  if (scope === 'unit') {
    const sourceUnit = getUnit(sourcePublisherId, unitId)
    if (!sourceUnit) return []
    return [
      { publisherId: sourcePublisherId, refId: unitId },
      ...findMatchingUnitsAcrossPublishers(sourcePublisherId, unitId).map((m) => ({
        publisherId: m.publisherId,
        refId: m.unitId,
      })),
    ]
  }
  if (scope === 'topic') {
    const sourceTopic = getTopic(sourcePublisherId, unitId, topicId)
    if (!sourceTopic) return []
    return [
      { publisherId: sourcePublisherId, refId: topicId },
      ...findMatchingTopicsAcrossPublishers(sourcePublisherId, unitId, topicId).map((m) => ({
        publisherId: m.publisherId,
        refId: m.topicId,
      })),
    ]
  }
  const sourceLesson = getLesson(sourcePublisherId, unitId, topicId, lessonId)
  if (!sourceLesson) return []
  return [
    { publisherId: sourcePublisherId, refId: lessonId },
    ...findMatchingLessonsAcrossPublishers(sourcePublisherId, unitId, topicId, lessonId).map((m) => ({
      publisherId: m.publisherId,
      refId: m.lessonId,
    })),
  ]
}

// refId는 항상 "{퍼블리셔id}-..." 형태로 시작하므로, 저장된 매칭 정보 없이도
// refId만 보고 그 퀴즈를 처음 만든 출판사를 알아낼 수 있다.
export function inferPublisherIdFromRefId(refId) {
  if (!refId) return null
  return getPublishers().find((p) => refId.startsWith(`${p.id}-`))?.id ?? null
}

function locateUnitIdForTopic(publisherId, topicId) {
  return getUnits(publisherId).find((u) => getTopics(publisherId, u.id).some((t) => t.id === topicId))?.id ?? null
}

function locateUnitAndTopicForLesson(publisherId, lessonId) {
  for (const unit of getUnits(publisherId)) {
    const topic = getTopics(publisherId, unit.id).find((t) =>
      getLessons(publisherId, unit.id, t.id).some((l) => l.id === lessonId),
    )
    if (topic) return { unitId: unit.id, topicId: topic.id }
  }
  return null
}

/**
 * 퀴즈가 원래 어느 출판사 교과서 기준으로 저장됐든(refId의 접두어로 판단),
 * 대상 출판사에서 진도표 순서가 같은 학습주제/차시의 refId로 즉석에서
 * 변환한다. 퀴즈를 저장할 때 매칭 정보를 미리 계산해 둘 필요가 없어서,
 * 이미 저장된 퀴즈에도(과거에 만든 것 포함) 똑같이 적용된다.
 */
export function resolveRefIdForPublisher(scope, refId, targetPublisherId) {
  const sourcePublisherId = inferPublisherIdFromRefId(refId)
  if (!sourcePublisherId || sourcePublisherId === targetPublisherId) return refId

  if (scope === 'unit') {
    const match = findMatchingUnitsAcrossPublishers(sourcePublisherId, refId).find(
      (m) => m.publisherId === targetPublisherId,
    )
    return match?.unitId ?? null
  }
  if (scope === 'topic') {
    const unitId = locateUnitIdForTopic(sourcePublisherId, refId)
    if (!unitId) return null
    const match = findMatchingTopicsAcrossPublishers(sourcePublisherId, unitId, refId).find(
      (m) => m.publisherId === targetPublisherId,
    )
    return match?.topicId ?? null
  }
  const located = locateUnitAndTopicForLesson(sourcePublisherId, refId)
  if (!located) return null
  const match = findMatchingLessonsAcrossPublishers(
    sourcePublisherId,
    located.unitId,
    located.topicId,
    refId,
  ).find((m) => m.publisherId === targetPublisherId)
  return match?.lessonId ?? null
}
