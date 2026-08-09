import { describe, it, expect } from 'vitest'
import {
  selectVisibleQuestionsForScope,
  selectVisibleQuestionsForTopic,
  isPublishedQuiz,
} from './quizVisibility.js'

describe('selectVisibleQuestionsForScope', () => {
  it('lesson/topic 범위는 정확히 일치하는 scope+refId만 (숨김 제외) 반환한다', () => {
    const all = [
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', visible: true },
      { id: 'q2', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', visible: false },
      { id: 'q3', scope: 'topic', refId: 'ecrimedia-u1-t2', visible: true },
    ]
    expect(
      selectVisibleQuestionsForScope(all, {
        publisherId: 'ecrimedia',
        scope: 'lesson',
        refId: 'ecrimedia-u1-t2-l1',
      }),
    ).toEqual([all[0]])
  })

  it('visible 필드가 없으면(기존 데이터) 보이는 것으로 취급한다', () => {
    const all = [{ id: 'q1', scope: 'topic', refId: 'ecrimedia-u1-t2' }]
    expect(
      selectVisibleQuestionsForScope(all, {
        publisherId: 'ecrimedia',
        scope: 'topic',
        refId: 'ecrimedia-u1-t2',
      }),
    ).toEqual(all)
  })

  it('unit 범위는 unit-scope뿐 아니라 그 대단원에 속한 모든 학습주제/차시 퀴즈까지 롤업해서 반환한다', () => {
    const all = [
      { id: 'q-unit', scope: 'unit', refId: 'ecrimedia-u1', visible: true },
      { id: 'q-topic', scope: 'topic', refId: 'ecrimedia-u1-t2', visible: true },
      { id: 'q-lesson', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', visible: true },
      { id: 'q-other-unit', scope: 'unit', refId: 'ecrimedia-u2', visible: true },
      { id: 'q-hidden-topic', scope: 'topic', refId: 'ecrimedia-u1-t2', visible: false },
    ]
    const result = selectVisibleQuestionsForScope(all, {
      publisherId: 'ecrimedia',
      scope: 'unit',
      refId: 'ecrimedia-u1',
    })
    expect(result.map((q) => q.id).sort()).toEqual(['q-lesson', 'q-topic', 'q-unit'])
  })

  it('다른 출판사 학습주제에서 만든 퀴즈도 refs에 이 출판사 매칭 refId가 있으면 보인다', () => {
    const all = [
      {
        id: 'q1',
        scope: 'lesson',
        refId: 'ecrimedia-u1-t2-l1',
        visible: true,
        refs: [
          { publisherId: 'ecrimedia', refId: 'ecrimedia-u1-t2-l1' },
          { publisherId: 'chunjae-park', refId: 'chunjae-park-u1-t2-l1' },
        ],
      },
    ]
    expect(
      selectVisibleQuestionsForScope(all, {
        publisherId: 'chunjae-park',
        scope: 'lesson',
        refId: 'chunjae-park-u1-t2-l1',
      }),
    ).toEqual([all[0]])
    expect(
      selectVisibleQuestionsForScope(all, {
        publisherId: 'jihak',
        scope: 'lesson',
        refId: 'jihak-u1-t2-l1',
      }),
    ).toEqual([])
  })

  it("unit 롤업에서도 refs를 통한 다른 출판사 매칭이 반영된다", () => {
    const all = [
      {
        id: 'q1',
        scope: 'topic',
        refId: 'ecrimedia-u1-t2',
        visible: true,
        refs: [
          { publisherId: 'ecrimedia', refId: 'ecrimedia-u1-t2' },
          { publisherId: 'chunjae-park', refId: 'chunjae-park-u1-t2' },
        ],
      },
    ]
    const result = selectVisibleQuestionsForScope(all, {
      publisherId: 'chunjae-park',
      scope: 'unit',
      refId: 'chunjae-park-u1',
    })
    expect(result).toEqual([all[0]])
  })

  it('status가 pending인(검토 대기) 퀴즈는 승인 전까지 제외한다', () => {
    const all = [
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', status: 'pending' },
      { id: 'q2', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', status: 'published' },
      { id: 'q3', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1' },
    ]
    const result = selectVisibleQuestionsForScope(all, {
      publisherId: 'ecrimedia',
      scope: 'lesson',
      refId: 'ecrimedia-u1-t2-l1',
    })
    expect(result.map((q) => q.id).sort()).toEqual(['q2', 'q3'])
  })
})

describe('isPublishedQuiz', () => {
  it('visible:false 또는 status:pending이면 false, 그 외에는 true를 반환한다', () => {
    expect(isPublishedQuiz({})).toBe(true)
    expect(isPublishedQuiz({ visible: true, status: 'published' })).toBe(true)
    expect(isPublishedQuiz({ visible: false })).toBe(false)
    expect(isPublishedQuiz({ status: 'pending' })).toBe(false)
  })
})

describe('selectVisibleQuestionsForTopic', () => {
  it('그 학습주제의 topic-scope 퀴즈와, 그 안 차시들의 lesson-scope 퀴즈를 모두 반환한다', () => {
    const all = [
      { id: 'q-topic', scope: 'topic', refId: 'ecrimedia-u1-t2' },
      { id: 'q-lesson', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1' },
      { id: 'q-other-topic', scope: 'topic', refId: 'ecrimedia-u1-t3' },
      { id: 'q-pending', scope: 'topic', refId: 'ecrimedia-u1-t2', status: 'pending' },
    ]
    const result = selectVisibleQuestionsForTopic(all, {
      publisherId: 'ecrimedia',
      unitId: 'ecrimedia-u1',
      topicId: 'ecrimedia-u1-t2',
    })
    expect(result.map((q) => q.id).sort()).toEqual(['q-lesson', 'q-topic'])
  })

  it('다른 출판사에서 만든 퀴즈도 refs 매칭을 통해 이 학습주제에서 보인다', () => {
    const all = [
      {
        id: 'q-topic',
        scope: 'topic',
        refId: 'ecrimedia-u1-t2',
        refs: [
          { publisherId: 'ecrimedia', refId: 'ecrimedia-u1-t2' },
          { publisherId: 'chunjae-park', refId: 'chunjae-park-u1-t2' },
        ],
      },
    ]
    const result = selectVisibleQuestionsForTopic(all, {
      publisherId: 'chunjae-park',
      unitId: 'chunjae-park-u1',
      topicId: 'chunjae-park-u1-t2',
    })
    expect(result).toEqual([all[0]])
  })
})
