import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import QuizPage from './QuizPage.jsx'

vi.mock('../lib/quizzesRepo.js', () => ({
  fetchAllQuestions: vi.fn(),
}))

import { fetchAllQuestions } from '../lib/quizzesRepo.js'

function renderPage(path, initialIndex = 1) {
  return render(
    <MemoryRouter initialEntries={['/prev', path]} initialIndex={initialIndex}>
      <Routes>
        <Route path="/prev" element={<div>이전 화면</div>} />
        <Route path="/quiz/:publisherId/:scope/:refId" element={<QuizPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchAllQuestions.mockResolvedValue([])
})

describe('QuizPage', () => {
  it('문제가 없으면 준비 중 안내와 0개를 보여준다', async () => {
    renderPage('/quiz/ecrimedia/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() =>
      expect(screen.getByText('이 차시 퀴즈는 준비 중이에요.')).toBeInTheDocument(),
    )
    expect(screen.getByText('현재 등록된 문항 수: 0개')).toBeInTheDocument()
  })

  it('문제를 불러오지 못하면 에러 메시지를 보여준다', async () => {
    fetchAllQuestions.mockRejectedValue(new Error('network error'))
    renderPage('/quiz/ecrimedia/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() =>
      expect(screen.getByText('퀴즈를 불러오지 못했어요.')).toBeInTheDocument(),
    )
  })

  it('알 수 없는 scope는 안내 문구를 보여주고 문제를 불러오지 않는다', () => {
    renderPage('/quiz/ecrimedia/garbage/x')
    expect(screen.getByText('알 수 없는 퀴즈 범위예요.')).toBeInTheDocument()
    expect(fetchAllQuestions).not.toHaveBeenCalled()
  })

  it('scope+refId가 정확히 일치하는(lesson/topic) 문제만 보여준다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t5-l1', type: 'ox', question: '이 차시 문제', answer: 'O' },
      { id: 'q2', scope: 'lesson', refId: 'ecrimedia-u1-t5-l2', type: 'ox', question: '다른 차시 문제', answer: 'O' },
    ])
    renderPage('/quiz/ecrimedia/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('이 차시 문제')).toBeInTheDocument())
    expect(screen.queryByText('다른 차시 문제')).not.toBeInTheDocument()
  })

  it('숨김(visible:false) 처리된 문제는 보여주지 않는다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t5-l1', type: 'ox', question: '숨긴 문제', answer: 'O', visible: false },
    ])
    renderPage('/quiz/ecrimedia/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() =>
      expect(screen.getByText('이 차시 퀴즈는 준비 중이에요.')).toBeInTheDocument(),
    )
    expect(screen.queryByText('숨긴 문제')).not.toBeInTheDocument()
  })

  it('대단원(unit) 범위는 그 대단원의 학습주제·차시 문제까지 롤업해서 보여준다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q-unit', scope: 'unit', refId: 'ecrimedia-u1', type: 'ox', question: '대단원 문제', answer: 'O' },
      { id: 'q-topic', scope: 'topic', refId: 'ecrimedia-u1-t2', type: 'ox', question: '학습주제 문제', answer: 'O' },
      { id: 'q-lesson', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '차시 문제', answer: 'O' },
      { id: 'q-hidden', scope: 'topic', refId: 'ecrimedia-u1-t2', type: 'ox', question: '숨긴 학습주제 문제', answer: 'O', visible: false },
    ])
    renderPage('/quiz/ecrimedia/unit/ecrimedia-u1')

    await waitFor(() => expect(screen.getByText('대단원 문제')).toBeInTheDocument())
    expect(screen.getByText('학습주제 문제')).toBeInTheDocument()
    expect(screen.getByText('차시 문제')).toBeInTheDocument()
    expect(screen.queryByText('숨긴 학습주제 문제')).not.toBeInTheDocument()
  })

  it('보기에 imageUrl이 있으면 이미지를 함께 보여준다(문자열 보기와도 함께 섞여도 오류 없이)', async () => {
    fetchAllQuestions.mockResolvedValue([
      {
        id: 'q1',
        scope: 'lesson',
        refId: 'ecrimedia-u1-t5-l1',
        type: 'multiple-choice',
        question: '유적 문제',
        choices: [
          { text: '첨성대', imageUrl: 'https://example.com/cheomseongdae.jpg' },
          '오래된 문자열 보기',
        ],
        answerIndex: 0,
      },
    ])
    renderPage('/quiz/ecrimedia/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('유적 문제')).toBeInTheDocument())
    expect(screen.getByRole('img', { name: '첨성대' })).toHaveAttribute(
      'src',
      'https://example.com/cheomseongdae.jpg',
    )
    expect(screen.getByLabelText('오래된 문자열 보기')).toBeInTheDocument()
  })

  it('제출자(submittedBy)가 있는 문제는 만든 학교·이름을 보여준다', async () => {
    fetchAllQuestions.mockResolvedValue([
      {
        id: 'q1',
        scope: 'lesson',
        refId: 'ecrimedia-u1-t5-l1',
        type: 'ox',
        question: '학생이 만든 문제',
        answer: 'O',
        submittedBy: { schoolName: '송림초등학교', studentName: '홍길동' },
      },
    ])
    renderPage('/quiz/ecrimedia/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('학생이 만든 문제')).toBeInTheDocument())
    expect(screen.getByText('만든이: 송림초등학교 · 홍길동')).toBeInTheDocument()
  })

  it('객관식 문제에서 정답을 고르고 제출하면 정답 메시지를 보여준다', async () => {
    fetchAllQuestions.mockResolvedValue([
      {
        id: 'q1',
        scope: 'lesson',
        refId: 'ecrimedia-u1-t5-l1',
        type: 'multiple-choice',
        question: '질문입니다',
        choices: ['보기1', '보기2'],
        answerIndex: 1,
      },
    ])
    renderPage('/quiz/ecrimedia/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('질문입니다')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText('보기2'))
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('status')).toHaveTextContent('정답이에요')
  })

  it('객관식 문제에서 오답을 고르고 제출하면 오답 메시지를 보여준다', async () => {
    fetchAllQuestions.mockResolvedValue([
      {
        id: 'q1',
        scope: 'lesson',
        refId: 'ecrimedia-u1-t5-l1',
        type: 'multiple-choice',
        question: '질문입니다',
        choices: ['보기1', '보기2'],
        answerIndex: 1,
      },
    ])
    renderPage('/quiz/ecrimedia/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('질문입니다')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText('보기1'))
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('status')).toHaveTextContent('아쉬워요')
  })

  it('OX 문제에서 정답 버튼을 누르고 제출하면 정답 메시지를 보여준다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t5-l1', type: 'ox', question: 'OX 질문', answer: 'O' },
    ])
    renderPage('/quiz/ecrimedia/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('OX 질문')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'O' }))
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('status')).toHaveTextContent('정답이에요')
  })

  it('단답식 문제는 공백을 제거하고 비교해서 채점한다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t5-l1', type: 'short-answer', question: '단답 질문', answer: '정답' },
    ])
    renderPage('/quiz/ecrimedia/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('단답 질문')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('답 입력'), { target: { value: ' 정답 ' } })
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('status')).toHaveTextContent('정답이에요')
  })

  it('뒤로 가기 버튼을 누르면 이전 화면으로 돌아간다', () => {
    renderPage('/quiz/ecrimedia/lesson/ecrimedia-u1-t5-l1')
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }))
    expect(screen.getByText('이전 화면')).toBeInTheDocument()
  })
})
