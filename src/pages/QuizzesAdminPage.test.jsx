import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import QuizzesAdminPage from './QuizzesAdminPage.jsx'

vi.mock('../lib/quizzesRepo.js', () => ({
  fetchQuestions: vi.fn(),
  createQuestion: vi.fn(),
  updateQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
}))

import {
  fetchQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../lib/quizzesRepo.js'

function selectTarget() {
  fireEvent.change(screen.getByLabelText('출판사'), { target: { value: 'ecrimedia' } })
  fireEvent.change(screen.getByLabelText('대단원'), { target: { value: 'ecrimedia-u1' } })
  fireEvent.change(screen.getByLabelText('학습주제'), { target: { value: 'ecrimedia-u1-t2' } })
  fireEvent.change(screen.getByLabelText('차시'), { target: { value: 'ecrimedia-u1-t2-l1' } })
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchQuestions.mockResolvedValue([])
})

describe('QuizzesAdminPage', () => {
  it('범위와 대상을 고르면 그 범위의 문제 목록을 보여준다', async () => {
    fetchQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '문제입니다', answer: 'O' },
    ])
    render(<QuizzesAdminPage />)
    selectTarget()

    await waitFor(() =>
      expect(fetchQuestions).toHaveBeenCalledWith('lesson', 'ecrimedia-u1-t2-l1'),
    )
    expect(screen.getByText('문제입니다')).toBeInTheDocument()
  })

  it('출판사를 바꿔 refId가 비면 이전 대상의 문제 목록이 즉시 사라진다', async () => {
    fetchQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '문제입니다', answer: 'O' },
    ])
    render(<QuizzesAdminPage />)
    selectTarget()
    await waitFor(() => expect(screen.getByText('문제입니다')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('출판사'), { target: { value: 'chunjae-park' } })

    await waitFor(() => expect(screen.queryByText('문제입니다')).not.toBeInTheDocument())
  })

  it('문제 목록을 불러오지 못하면 에러 메시지를 보여준다', async () => {
    fetchQuestions.mockRejectedValue(new Error('network error'))
    render(<QuizzesAdminPage />)
    selectTarget()

    await waitFor(() =>
      expect(screen.getByText('문제 목록을 불러오지 못했어요.')).toBeInTheDocument(),
    )
  })

  it('문제 저장이 실패하면 폼이 유지되고 에러 메시지를 보여준다', async () => {
    createQuestion.mockRejectedValue(new Error('write failed'))
    render(<QuizzesAdminPage />)
    selectTarget()
    await waitFor(() => expect(fetchQuestions).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새 문제 추가' }))
    fireEvent.change(screen.getByLabelText('문제 유형'), { target: { value: 'ox' } })
    fireEvent.change(screen.getByLabelText('문제'), { target: { value: 'OX 질문' } })
    fireEvent.click(screen.getByLabelText('정답: O'))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('저장에 실패했어요'),
    )
    expect(screen.getByLabelText('문제')).toHaveValue('OX 질문')
  })

  it('객관식 문제를 만들면 choices와 answerIndex를 담아 createQuestion을 호출한다', async () => {
    createQuestion.mockResolvedValue('new-id')
    render(<QuizzesAdminPage />)
    selectTarget()
    await waitFor(() => expect(fetchQuestions).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새 문제 추가' }))
    fireEvent.change(screen.getByLabelText('문제 유형'), { target: { value: 'multiple-choice' } })
    fireEvent.change(screen.getByLabelText('문제'), { target: { value: '질문입니다' } })
    fireEvent.change(screen.getByLabelText('보기 텍스트'), { target: { value: '보기1' } })
    fireEvent.click(screen.getByRole('button', { name: '보기 추가' }))
    fireEvent.change(screen.getByLabelText('보기 텍스트'), { target: { value: '보기2' } })
    fireEvent.click(screen.getByRole('button', { name: '보기 추가' }))
    fireEvent.click(screen.getByLabelText('정답: 보기2'))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(createQuestion).toHaveBeenCalledWith({
        scope: 'lesson',
        refId: 'ecrimedia-u1-t2-l1',
        type: 'multiple-choice',
        question: '질문입니다',
        choices: ['보기1', '보기2'],
        answerIndex: 1,
      }),
    )
  })

  it('OX 문제를 만들면 answer:"O"|"X"로 createQuestion을 호출한다', async () => {
    createQuestion.mockResolvedValue('new-id')
    render(<QuizzesAdminPage />)
    selectTarget()
    await waitFor(() => expect(fetchQuestions).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새 문제 추가' }))
    fireEvent.change(screen.getByLabelText('문제 유형'), { target: { value: 'ox' } })
    fireEvent.change(screen.getByLabelText('문제'), { target: { value: 'OX 질문' } })
    fireEvent.click(screen.getByLabelText('정답: X'))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(createQuestion).toHaveBeenCalledWith({
        scope: 'lesson',
        refId: 'ecrimedia-u1-t2-l1',
        type: 'ox',
        question: 'OX 질문',
        answer: 'X',
      }),
    )
  })

  it('단답식 문제를 만들면 answer 텍스트로 createQuestion을 호출한다', async () => {
    createQuestion.mockResolvedValue('new-id')
    render(<QuizzesAdminPage />)
    selectTarget()
    await waitFor(() => expect(fetchQuestions).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새 문제 추가' }))
    fireEvent.change(screen.getByLabelText('문제 유형'), { target: { value: 'short-answer' } })
    fireEvent.change(screen.getByLabelText('문제'), { target: { value: '단답 질문' } })
    fireEvent.change(screen.getByLabelText('정답'), { target: { value: '정답텍스트' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(createQuestion).toHaveBeenCalledWith({
        scope: 'lesson',
        refId: 'ecrimedia-u1-t2-l1',
        type: 'short-answer',
        question: '단답 질문',
        answer: '정답텍스트',
      }),
    )
  })

  it('수정 버튼을 누르면 기존 값이 채워진 폼이 보인다', async () => {
    fetchQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '문제입니다', answer: 'O' },
    ])
    render(<QuizzesAdminPage />)
    selectTarget()
    await waitFor(() => expect(screen.getByText('문제입니다')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    expect(screen.getByLabelText('문제')).toHaveValue('문제입니다')
  })

  it('삭제 버튼을 누르면 deleteQuestion이 호출되고 목록에서 사라진다', async () => {
    const sampleQuestion = {
      id: 'q1',
      scope: 'lesson',
      refId: 'ecrimedia-u1-t2-l1',
      type: 'ox',
      question: '문제입니다',
      answer: 'O',
    }
    // fetchQuestions fires twice before the delete: once on initial mount
    // (with the default scope/target) and once more after selectTarget()
    // settles on the final target. Both must resolve with the question so
    // it can be found and deleted; only the reload triggered by the delete
    // itself should come back empty.
    fetchQuestions
      .mockResolvedValueOnce([sampleQuestion])
      .mockResolvedValueOnce([sampleQuestion])
      .mockResolvedValueOnce([])
    deleteQuestion.mockResolvedValue()
    render(<QuizzesAdminPage />)
    selectTarget()
    await waitFor(() => expect(screen.getByText('문제입니다')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(deleteQuestion).toHaveBeenCalledWith('q1'))
    await waitFor(() => expect(screen.queryByText('문제입니다')).not.toBeInTheDocument())

    // Guard against a regression to local-filter deletion: with only one
    // question in the fixture, a synchronous setQuestions(prev => prev
    // .filter(...)) would also leave the list empty, so the assertions
    // above alone can't tell reload-based delete apart from local-filter
    // delete. Asserting a 3rd fetchQuestions call (mount + target-settle
    // + post-delete reload) only holds if handleDelete actually calls
    // reload() after deleteQuestion().
    await waitFor(() => expect(fetchQuestions).toHaveBeenCalledTimes(3))
    expect(fetchQuestions).toHaveBeenNthCalledWith(3, 'lesson', 'ecrimedia-u1-t2-l1')
  })
})
