import { describe, it, expect, vi, beforeEach } from 'vitest'
import { collection, doc, getDocs, addDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore'
import {
  fetchQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from './quizzesRepo.js'

vi.mock('../firebase.js', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...args) => ({ __collection: args })),
  doc: vi.fn((...args) => ({ __doc: args })),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn((...args) => ({ __query: args })),
  where: vi.fn((...args) => ({ __where: args })),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function fakeSnapshot(docs) {
  return { docs: docs.map((d) => ({ id: d.id, data: () => d.data })) }
}

describe('fetchQuestions', () => {
  it('scope와 refId가 정확히 일치하는 문제만 조회한다', async () => {
    getDocs.mockResolvedValue(
      fakeSnapshot([{ id: 'q1', data: { type: 'ox', question: '문제1', answer: 'O' } }]),
    )
    const result = await fetchQuestions('lesson', 'ecrimedia-u1-t5-l1')
    expect(where).toHaveBeenCalledWith('scope', '==', 'lesson')
    expect(where).toHaveBeenCalledWith('refId', '==', 'ecrimedia-u1-t5-l1')
    expect(result).toEqual([{ id: 'q1', type: 'ox', question: '문제1', answer: 'O' }])
  })
})

describe('createQuestion', () => {
  it('새 문제를 추가하고 생성된 id를 반환한다', async () => {
    addDoc.mockResolvedValue({ id: 'new-id' })
    const id = await createQuestion({
      scope: 'lesson',
      refId: 'ecrimedia-u1-t5-l1',
      type: 'multiple-choice',
      question: '질문',
      choices: ['a', 'b'],
      answerIndex: 0,
    })
    expect(id).toBe('new-id')
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: 'multiple-choice', answerIndex: 0 }),
    )
  })
})

describe('updateQuestion', () => {
  it('기존 문제를 전체 교체 방식으로 갱신한다(이전 유형의 남은 필드가 남지 않도록)', async () => {
    setDoc.mockResolvedValue()
    await updateQuestion('q1', { type: 'ox', question: '바뀐 문제', answer: 'X' })
    expect(setDoc).toHaveBeenCalledWith(expect.anything(), {
      type: 'ox',
      question: '바뀐 문제',
      answer: 'X',
    })
  })
})

describe('deleteQuestion', () => {
  it('문제를 삭제한다', async () => {
    deleteDoc.mockResolvedValue()
    await deleteQuestion('q1')
    expect(deleteDoc).toHaveBeenCalled()
  })
})
