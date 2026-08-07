import { describe, it, expect } from 'vitest'
import {
  selectUnits,
  selectUnit,
  selectTopics,
  selectTopic,
  selectLessons,
  selectLesson,
  selectQuizQuestions,
  getPublishers,
  getUnits,
  getTopics,
  getLessons,
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

describe('selectQuizQuestions', () => {
  const quizzes = [
    { id: 'q1', scope: 'lesson', refId: 'l1', parentTopicId: 't1', parentUnitId: 'u1', questions: [{ id: 'q1-a' }] },
    { id: 'q2', scope: 'lesson', refId: 'l2', parentTopicId: 't1', parentUnitId: 'u1', questions: [{ id: 'q2-a' }] },
    { id: 'q3', scope: 'lesson', refId: 'l3', parentTopicId: 't2', parentUnitId: 'u1', questions: [{ id: 'q3-a' }] },
  ]

  it('lesson scope는 해당 차시 문항만 반환한다', () => {
    expect(selectQuizQuestions(quizzes, 'lesson', 'l1')).toEqual([{ id: 'q1-a' }])
  })

  it('topic scope는 소속 차시 문항을 모두 모아 반환한다', () => {
    expect(selectQuizQuestions(quizzes, 'topic', 't1')).toEqual([{ id: 'q1-a' }, { id: 'q2-a' }])
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
