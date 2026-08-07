import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import QuizPage from './QuizPage.jsx'

vi.mock('../lib/quizzesRepo.js', () => ({
  fetchQuestions: vi.fn(),
}))

import { fetchQuestions } from '../lib/quizzesRepo.js'

function renderPage(path, initialIndex = 1) {
  return render(
    <MemoryRouter initialEntries={['/prev', path]} initialIndex={initialIndex}>
      <Routes>
        <Route path="/prev" element={<div>이전 화면</div>} />
        <Route path="/quiz/:scope/:refId" element={<QuizPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('QuizPage', () => {
  it('문제가 없으면 준비 중 안내와 0개를 보여준다', async () => {
    fetchQuestions.mockResolvedValue([])
    renderPage('/quiz/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() =>
      expect(screen.getByText('이 차시 퀴즈는 준비 중이에요.')).toBeInTheDocument(),
    )
    expect(screen.getByText('현재 등록된 문항 수: 0개')).toBeInTheDocument()
  })

  it('문제를 불러오지 못하면 에러 메시지를 보여준다', async () => {
    fetchQuestions.mockRejectedValue(new Error('network error'))
    renderPage('/quiz/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() =>
      expect(screen.getByText('퀴즈를 불러오지 못했어요.')).toBeInTheDocument(),
    )
  })

  it('알 수 없는 scope는 안내 문구를 보여주고 문제를 불러오지 않는다', () => {
    renderPage('/quiz/garbage/x')
    expect(screen.getByText('알 수 없는 퀴즈 범위예요.')).toBeInTheDocument()
    expect(fetchQuestions).not.toHaveBeenCalled()
  })

  it('객관식 문제에서 정답을 고르고 제출하면 정답 메시지를 보여준다', async () => {
    fetchQuestions.mockResolvedValue([
      {
        id: 'q1',
        type: 'multiple-choice',
        question: '질문입니다',
        choices: ['보기1', '보기2'],
        answerIndex: 1,
      },
    ])
    renderPage('/quiz/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('질문입니다')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText('보기2'))
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('status')).toHaveTextContent('정답이에요')
  })

  it('객관식 문제에서 오답을 고르고 제출하면 오답 메시지를 보여준다', async () => {
    fetchQuestions.mockResolvedValue([
      {
        id: 'q1',
        type: 'multiple-choice',
        question: '질문입니다',
        choices: ['보기1', '보기2'],
        answerIndex: 1,
      },
    ])
    renderPage('/quiz/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('질문입니다')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText('보기1'))
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('status')).toHaveTextContent('아쉬워요')
  })

  it('OX 문제에서 정답 버튼을 누르고 제출하면 정답 메시지를 보여준다', async () => {
    fetchQuestions.mockResolvedValue([
      { id: 'q1', type: 'ox', question: 'OX 질문', answer: 'O' },
    ])
    renderPage('/quiz/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('OX 질문')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'O' }))
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('status')).toHaveTextContent('정답이에요')
  })

  it('단답식 문제는 공백을 제거하고 비교해서 채점한다', async () => {
    fetchQuestions.mockResolvedValue([
      { id: 'q1', type: 'short-answer', question: '단답 질문', answer: '정답' },
    ])
    renderPage('/quiz/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('단답 질문')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('답 입력'), { target: { value: ' 정답 ' } })
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('status')).toHaveTextContent('정답이에요')
  })

  it('뒤로 가기 버튼을 누르면 이전 화면으로 돌아간다', () => {
    renderPage('/quiz/lesson/ecrimedia-u1-t5-l1')
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }))
    expect(screen.getByText('이전 화면')).toBeInTheDocument()
  })
})
