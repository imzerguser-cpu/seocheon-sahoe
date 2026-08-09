import { describe, it, expect } from 'vitest'
import {
  selectUnits,
  selectUnit,
  selectTopics,
  selectTopic,
  selectLessons,
  selectLesson,
  getPublishers,
  getUnits,
  getTopics,
  getLessons,
  getTopic,
  getLesson,
  findMatchingLessonsAcrossPublishers,
  findMatchingUnitsAcrossPublishers,
  findMatchingTopicsAcrossPublishers,
  findMatchingRefsAcrossPublishers,
} from './dataLoader.js'

const sampleCurriculum = {
  units: [
    {
      id: 'u2', title: '2단원', order: 2,
      topics: [{ id: 'u2-t1', title: '주제A', order: 1, lessons: [{ id: 'u2-t1-l1', 차시순서: 1, 전체차시: 1, 쪽수: '1~2', 성취기준: [] }] }],
    },
    {
      id: 'u1', title: '1단원', order: 1,
      topics: [
        {
          id: 'u1-t1', title: '주제B', order: 1,
          lessons: [
            { id: 'u1-t1-l2', 차시순서: 2, 전체차시: 2, 쪽수: '5~6', 성취기준: [] },
            { id: 'u1-t1-l1', 차시순서: 1, 전체차시: 2, 쪽수: '3~4', 성취기준: ['[4사01-01] 예시'] },
          ],
        },
      ],
    },
  ],
}

describe('selectUnits', () => {
  it('order 기준으로 정렬해서 반환한다', () => {
    expect(selectUnits(sampleCurriculum).map((u) => u.id)).toEqual(['u1', 'u2'])
  })

  it('curriculum이 없으면 빈 배열을 반환한다', () => {
    expect(selectUnits(null)).toEqual([])
  })
})

describe('selectUnit', () => {
  it('id로 단원을 찾는다', () => {
    expect(selectUnit(sampleCurriculum, 'u2').title).toBe('2단원')
  })

  it('없는 id는 null을 반환한다', () => {
    expect(selectUnit(sampleCurriculum, 'nope')).toBeNull()
  })
})

describe('selectTopics / selectTopic', () => {
  it('해당 단원의 학습주제를 반환한다', () => {
    expect(selectTopics(sampleCurriculum, 'u1')).toHaveLength(1)
  })

  it('단원이 없으면 빈 배열을 반환한다', () => {
    expect(selectTopics(sampleCurriculum, 'nope')).toEqual([])
  })

  it('학습주제를 id로 찾는다', () => {
    expect(selectTopic(sampleCurriculum, 'u1', 'u1-t1').title).toBe('주제B')
  })
})

describe('selectLessons / selectLesson', () => {
  it('차시순서 기준으로 정렬해서 반환한다', () => {
    expect(selectLessons(sampleCurriculum, 'u1', 'u1-t1').map((l) => l.id)).toEqual([
      'u1-t1-l1',
      'u1-t1-l2',
    ])
  })

  it('차시를 id로 찾는다', () => {
    const lesson = selectLesson(sampleCurriculum, 'u1', 'u1-t1', 'u1-t1-l1')
    expect(lesson.쪽수).toBe('3~4')
    expect(lesson.성취기준).toEqual(['[4사01-01] 예시'])
  })

  it('학습주제가 없으면 빈 배열을 반환한다', () => {
    expect(selectLessons(sampleCurriculum, 'u1', 'nope')).toEqual([])
  })
})

describe('실제 데이터에 바인딩된 함수', () => {
  it('getPublishers는 8개 출판사를 포함한다', () => {
    const ids = getPublishers().map((p) => p.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'chunjae-park', 'chunjae-kim', 'jihak', 'donga', 'ybm', 'ecrimedia', 'visang', 'mirae',
      ]),
    )
    expect(ids).toHaveLength(8)
  })

  it('getUnits(ecrimedia)는 4개 대단원을 반환한다', () => {
    expect(getUnits('ecrimedia')).toHaveLength(4)
  })

  it('getTopics(ecrimedia, 1단원)에 실제 학습주제 제목이 들어있다', () => {
    const topics = getTopics('ecrimedia', 'ecrimedia-u1')
    expect(topics.map((t) => t.title)).toContain('장소에 대해 알아볼까요')
  })

  it('getLessons는 차시순서 기준으로 정렬된 차시를 반환한다', () => {
    const lessons = getLessons('ecrimedia', 'ecrimedia-u1', 'ecrimedia-u1-t5')
    expect(lessons.map((l) => l.차시순서)).toEqual([1, 2])
    expect(lessons.map((l) => l.전체차시)).toEqual([2, 2])
  })
})

describe('findMatchingLessonsAcrossPublishers', () => {
  it('기준 차시와 같은 대단원 순서·학습주제 순서를 가진 차시를 다른 모든 출판사에서 찾아 반환한다', () => {
    const matches = findMatchingLessonsAcrossPublishers(
      'chunjae-park',
      'chunjae-park-u1',
      'chunjae-park-u1-t2',
      'chunjae-park-u1-t2-l1',
    )

    expect(matches.length).toBeGreaterThan(0)
    expect(matches.every((m) => m.publisherId !== 'chunjae-park')).toBe(true)

    const ecrimediaMatch = matches.find((m) => m.publisherId === 'ecrimedia')
    expect(ecrimediaMatch).toBeDefined()
    expect(ecrimediaMatch.unitId).toBe('ecrimedia-u1')
    expect(ecrimediaMatch.topicId).toBe('ecrimedia-u1-t2')

    const matchedTopic = getTopic('ecrimedia', ecrimediaMatch.unitId, ecrimediaMatch.topicId)
    expect(matchedTopic.order).toBe(2)
  })

  it('찾은 모든 매칭은 실제로 존재하는 대단원/학습주제/차시를 가리킨다', () => {
    const matches = findMatchingLessonsAcrossPublishers(
      'chunjae-park',
      'chunjae-park-u1',
      'chunjae-park-u1-t2',
      'chunjae-park-u1-t2-l1',
    )
    expect(matches.length).toBeGreaterThan(0)
    for (const match of matches) {
      const topic = getTopic(match.publisherId, match.unitId, match.topicId)
      const lesson = getLesson(match.publisherId, match.unitId, match.topicId, match.lessonId)
      expect(topic).not.toBeNull()
      expect(lesson).not.toBeNull()
    }
  })

  it('존재하지 않는 기준 차시를 넣으면 빈 배열을 반환한다', () => {
    const matches = findMatchingLessonsAcrossPublishers(
      'chunjae-park',
      'no-unit',
      'no-topic',
      'no-lesson',
    )
    expect(matches).toEqual([])
  })
})

describe('findMatchingUnitsAcrossPublishers', () => {
  it('같은 대단원 순서(order)를 가진 대단원을 다른 모든 출판사에서 찾아 반환한다', () => {
    const matches = findMatchingUnitsAcrossPublishers('chunjae-park', 'chunjae-park-u1')
    expect(matches.length).toBeGreaterThan(0)
    expect(matches.every((m) => m.publisherId !== 'chunjae-park')).toBe(true)
    const ecrimediaMatch = matches.find((m) => m.publisherId === 'ecrimedia')
    expect(ecrimediaMatch.unitId).toBe('ecrimedia-u1')
  })

  it('존재하지 않는 기준 대단원을 넣으면 빈 배열을 반환한다', () => {
    expect(findMatchingUnitsAcrossPublishers('chunjae-park', 'no-unit')).toEqual([])
  })
})

describe('findMatchingTopicsAcrossPublishers', () => {
  it('같은 대단원 순서·학습주제 순서를 가진 학습주제를 다른 모든 출판사에서 찾아 반환한다', () => {
    const matches = findMatchingTopicsAcrossPublishers(
      'chunjae-park',
      'chunjae-park-u1',
      'chunjae-park-u1-t2',
    )
    expect(matches.length).toBeGreaterThan(0)
    const ecrimediaMatch = matches.find((m) => m.publisherId === 'ecrimedia')
    expect(ecrimediaMatch.unitId).toBe('ecrimedia-u1')
    expect(ecrimediaMatch.topicId).toBe('ecrimedia-u1-t2')
  })

  it('존재하지 않는 기준 학습주제를 넣으면 빈 배열을 반환한다', () => {
    expect(
      findMatchingTopicsAcrossPublishers('chunjae-park', 'chunjae-park-u1', 'no-topic'),
    ).toEqual([])
  })
})

describe('findMatchingRefsAcrossPublishers', () => {
  it("scope가 'lesson'이면 기준 차시를 포함해 모든 출판사의 refId 목록을 반환한다", () => {
    const refs = findMatchingRefsAcrossPublishers('chunjae-park', 'lesson', {
      unitId: 'chunjae-park-u1',
      topicId: 'chunjae-park-u1-t2',
      lessonId: 'chunjae-park-u1-t2-l1',
    })
    expect(refs).toContainEqual({ publisherId: 'chunjae-park', refId: 'chunjae-park-u1-t2-l1' })
    const ecrimediaRef = refs.find((r) => r.publisherId === 'ecrimedia')
    expect(ecrimediaRef.refId).toBe('ecrimedia-u1-t2-l1')
  })

  it("scope가 'topic'이면 기준 학습주제를 포함해 모든 출판사의 refId 목록을 반환한다", () => {
    const refs = findMatchingRefsAcrossPublishers('chunjae-park', 'topic', {
      unitId: 'chunjae-park-u1',
      topicId: 'chunjae-park-u1-t2',
    })
    expect(refs).toContainEqual({ publisherId: 'chunjae-park', refId: 'chunjae-park-u1-t2' })
    const ecrimediaRef = refs.find((r) => r.publisherId === 'ecrimedia')
    expect(ecrimediaRef.refId).toBe('ecrimedia-u1-t2')
  })

  it("scope가 'unit'이면 기준 대단원을 포함해 모든 출판사의 refId 목록을 반환한다", () => {
    const refs = findMatchingRefsAcrossPublishers('chunjae-park', 'unit', {
      unitId: 'chunjae-park-u1',
    })
    expect(refs).toContainEqual({ publisherId: 'chunjae-park', refId: 'chunjae-park-u1' })
    const ecrimediaRef = refs.find((r) => r.publisherId === 'ecrimedia')
    expect(ecrimediaRef.refId).toBe('ecrimedia-u1')
  })

  it('존재하지 않는 기준을 넣으면 빈 배열을 반환한다', () => {
    expect(
      findMatchingRefsAcrossPublishers('chunjae-park', 'unit', { unitId: 'no-unit' }),
    ).toEqual([])
  })
})
