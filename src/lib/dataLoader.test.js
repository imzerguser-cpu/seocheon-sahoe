import { describe, it, expect } from 'vitest'
import {
  selectUnits,
  selectUnit,
  selectSubunits,
  selectSubunit,
  selectLessons,
  selectLesson,
  selectTopicsForLesson,
  selectQuizQuestions,
  getPublishers,
  getUnits,
  getTopicsForLesson,
} from './dataLoader.js'

const sampleCurriculum = {
  units: [
    {
      id: 'u2', title: '2단원', order: 2,
      subunits: [{ id: 'u2-s1', title: '2-1', order: 1, lessons: [{ id: 'u2-s1-l1', title: 'L', order: 1 }] }],
    },
    {
      id: 'u1', title: '1단원', order: 1,
      subunits: [
        {
          id: 'u1-s1', title: '1-1', order: 1,
          lessons: [
            { id: 'u1-s1-l2', title: '두번째', order: 2 },
            { id: 'u1-s1-l1', title: '첫번째', order: 1 },
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

describe('selectSubunits / selectSubunit', () => {
  it('해당 단원의 소단원을 반환한다', () => {
    expect(selectSubunits(sampleCurriculum, 'u1')).toHaveLength(1)
  })

  it('단원이 없으면 빈 배열을 반환한다', () => {
    expect(selectSubunits(sampleCurriculum, 'nope')).toEqual([])
  })

  it('소단원을 id로 찾는다', () => {
    expect(selectSubunit(sampleCurriculum, 'u1', 'u1-s1').title).toBe('1-1')
  })
})

describe('selectLessons / selectLesson', () => {
  it('order 기준으로 정렬해서 반환한다', () => {
    expect(selectLessons(sampleCurriculum, 'u1', 'u1-s1').map((l) => l.id)).toEqual([
      'u1-s1-l1',
      'u1-s1-l2',
    ])
  })

  it('차시를 id로 찾는다', () => {
    expect(selectLesson(sampleCurriculum, 'u1', 'u1-s1', 'u1-s1-l1').title).toBe('첫번째')
  })

  it('소단원이 없으면 빈 배열을 반환한다', () => {
    expect(selectLessons(sampleCurriculum, 'u1', 'nope')).toEqual([])
  })
})

describe('selectTopicsForLesson', () => {
  const topics = [
    { id: 't1', 차시제목: '토픽1' },
    { id: 't2', 차시제목: '토픽2' },
  ]
  const mappings = [
    { topicId: 't1', publisherId: 'pub-a', lessonId: 'l1' },
    { topicId: 't2', publisherId: 'pub-a', lessonId: 'l1' },
    { topicId: 't1', publisherId: 'pub-b', lessonId: 'l9' },
  ]

  it('출판사+차시로 매핑된 토픽을 모두 반환한다 (N:M)', () => {
    const result = selectTopicsForLesson(topics, mappings, 'pub-a', 'l1')
    expect(result.map((t) => t.id)).toEqual(['t1', 't2'])
  })

  it('매핑이 없으면 빈 배열을 반환한다', () => {
    expect(selectTopicsForLesson(topics, mappings, 'pub-a', 'l404')).toEqual([])
  })
})

describe('selectQuizQuestions', () => {
  const quizzes = [
    { id: 'q1', scope: 'lesson', refId: 'l1', parentSubunitId: 's1', parentUnitId: 'u1', questions: [{ id: 'q1-a' }] },
    { id: 'q2', scope: 'lesson', refId: 'l2', parentSubunitId: 's1', parentUnitId: 'u1', questions: [{ id: 'q2-a' }] },
    { id: 'q3', scope: 'lesson', refId: 'l3', parentSubunitId: 's2', parentUnitId: 'u1', questions: [{ id: 'q3-a' }] },
  ]

  it('lesson scope는 해당 차시 문항만 반환한다', () => {
    expect(selectQuizQuestions(quizzes, 'lesson', 'l1')).toEqual([{ id: 'q1-a' }])
  })

  it('subunit scope는 소속 차시 문항을 모두 모아 반환한다', () => {
    expect(selectQuizQuestions(quizzes, 'subunit', 's1')).toEqual([{ id: 'q1-a' }, { id: 'q2-a' }])
  })

  it('unit scope는 대단원 전체 문항을 모아 반환한다', () => {
    expect(selectQuizQuestions(quizzes, 'unit', 'u1')).toEqual([
      { id: 'q1-a' },
      { id: 'q2-a' },
      { id: 'q3-a' },
    ])
  })

  it('일치하는 문항이 없으면 빈 배열을 반환한다', () => {
    expect(selectQuizQuestions(quizzes, 'lesson', 'l404')).toEqual([])
  })
})

describe('실제 데이터에 바인딩된 함수', () => {
  it('getPublishers는 지학사와 천재교과서를 포함한다', () => {
    const ids = getPublishers().map((p) => p.id)
    expect(ids).toEqual(expect.arrayContaining(['jihak', 'chunjae']))
  })

  it('getUnits(jihak)는 1개 대단원을 반환한다', () => {
    expect(getUnits('jihak')).toHaveLength(1)
  })

  it('getTopicsForLesson은 chunjae의 첫 차시에 매핑된 토픽 2개를 반환한다', () => {
    const topics = getTopicsForLesson('chunjae', 'chunjae-u1-s1-l1')
    expect(topics.map((t) => t.id)).toEqual(['topic_1-1-1', 'topic_1-1-2'])
  })
})
