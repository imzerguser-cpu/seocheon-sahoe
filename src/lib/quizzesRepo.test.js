import { describe, it, expect, vi, beforeEach } from 'vitest'
import { collection, doc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import {
  fetchQuestions,
  fetchAllQuestions,
  createQuestion,
  updateQuestion,
  setQuestionVisibility,
  publishQuestion,
  deleteQuestion,
} from './quizzesRepo.js'

vi.mock('../firebase.js', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...args) => ({ __collection: args })),
  doc: vi.fn((...args) => ({ __doc: args })),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
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

describe('fetchAllQuestions', () => {
  it('컬렉션의 모든 문제를 id와 함께 반환한다', async () => {
    getDocs.mockResolvedValue(
      fakeSnapshot([
        { id: 'q1', data: { scope: 'lesson', refId: 'l1', type: 'ox', question: '문제1', answer: 'O' } },
        { id: 'q2', data: { scope: 'topic', refId: 't1', type: 'short-answer', question: '문제2', answer: '답' } },
      ]),
    )
    const result = await fetchAllQuestions()
    expect(result).toEqual([
      { id: 'q1', scope: 'lesson', refId: 'l1', type: 'ox', question: '문제1', answer: 'O' },
      { id: 'q2', scope: 'topic', refId: 't1', type: 'short-answer', question: '문제2', answer: '답' },
    ])
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

  it('visible을 지정하지 않으면 기본값 true로 저장한다', async () => {
    addDoc.mockResolvedValue({ id: 'new-id' })
    await createQuestion({ scope: 'lesson', refId: 'l1', type: 'ox', question: 'Q', answer: 'O' })
    expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ visible: true }))
  })

  it('visible을 명시하면 그 값을 그대로 저장한다', async () => {
    addDoc.mockResolvedValue({ id: 'new-id' })
    await createQuestion({
      scope: 'lesson',
      refId: 'l1',
      type: 'ox',
      question: 'Q',
      answer: 'O',
      visible: false,
    })
    expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ visible: false }))
  })

  it('옵션 없이 만들면 status:published, submittedBy:null로 저장한다(관리자 직접 등록)', async () => {
    addDoc.mockResolvedValue({ id: 'new-id' })
    await createQuestion({ scope: 'lesson', refId: 'l1', type: 'ox', question: 'Q', answer: 'O' })
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'published', submittedBy: null }),
    )
  })

  it('status:pending과 submittedBy를 지정하면(학생/교사 제출) 그대로 저장한다', async () => {
    addDoc.mockResolvedValue({ id: 'new-id' })
    const submittedBy = { schoolId: 'songlim-cho', schoolName: '송림초등학교', studentName: '홍길동', role: 'student' }
    await createQuestion(
      { scope: 'lesson', refId: 'l1', type: 'ox', question: 'Q', answer: 'O' },
      { status: 'pending', submittedBy },
    )
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'pending', submittedBy }),
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

describe('setQuestionVisibility', () => {
  it('visible 필드만 부분 업데이트한다', async () => {
    updateDoc.mockResolvedValue()
    await setQuestionVisibility('q1', false)
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { visible: false })
  })
})

describe('publishQuestion', () => {
  it('전달된 내용을 그대로 반영하고 status를 published로 만든다(submittedBy는 그대로 전달되면 유지)', async () => {
    setDoc.mockResolvedValue()
    const submittedBy = { schoolName: '송림초등학교', studentName: '홍길동' }
    await publishQuestion('q1', {
      scope: 'lesson',
      refId: 'l1',
      type: 'ox',
      question: '승인된 문제',
      answer: 'O',
      submittedBy,
    })
    expect(setDoc).toHaveBeenCalledWith(expect.anything(), {
      scope: 'lesson',
      refId: 'l1',
      type: 'ox',
      question: '승인된 문제',
      answer: 'O',
      submittedBy,
      status: 'published',
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
