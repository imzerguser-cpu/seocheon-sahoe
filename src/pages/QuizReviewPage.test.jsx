import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import QuizReviewPage from './QuizReviewPage.jsx'
import { saveAdminSession } from '../lib/auth.js'

function renderPage() {
  return render(
    <MemoryRouter>
      <QuizReviewPage />
    </MemoryRouter>,
  )
}

vi.mock('../lib/quizzesRepo.js', () => ({
  fetchAllQuestions: vi.fn(),
  publishQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
}))

import { fetchAllQuestions, publishQuestion, deleteQuestion } from '../lib/quizzesRepo.js'

const songlimSubmission = {
  id: 'q1',
  scope: 'lesson',
  refId: 'ecrimedia-u1-t5-l1',
  type: 'ox',
  question: '송림초 학생 제출 문제',
  answer: 'O',
  status: 'pending',
  submittedBy: { schoolId: 'songlim-cho', schoolName: '송림초등학교', studentName: '홍길동', role: 'student' },
}

const jangangSubmission = {
  id: 'q2',
  scope: 'lesson',
  refId: 'ecrimedia-u1-t6-l1',
  type: 'ox',
  question: '장항초 학생 제출 문제',
  answer: 'X',
  status: 'pending',
  submittedBy: { schoolId: 'jangang-cho', schoolName: '장항초등학교', studentName: '김철수', role: 'student' },
}

const publishedQuestion = {
  id: 'q3',
  scope: 'lesson',
  refId: 'ecrimedia-u1-t7-l1',
  type: 'ox',
  question: '이미 게시된 문제',
  answer: 'O',
  status: 'published',
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('QuizReviewPage (학교관리자로 로그인)', () => {
  beforeEach(() => {
    saveAdminSession({
      role: 'school-admin',
      schoolId: 'songlim-cho',
      schoolName: '송림초등학교',
      teacherName: '김선생',
    })
  })

  it('자기 학교 제출만 보이고 다른 학교 제출과 이미 게시된 문제는 보이지 않는다', async () => {
    fetchAllQuestions.mockResolvedValue([songlimSubmission, jangangSubmission, publishedQuestion])
    renderPage()

    await waitFor(() => expect(screen.getByText('송림초 학생 제출 문제')).toBeInTheDocument())
    expect(screen.queryByText('장항초 학생 제출 문제')).not.toBeInTheDocument()
    expect(screen.queryByText('이미 게시된 문제')).not.toBeInTheDocument()
    expect(screen.getByText('송림초등학교 · 홍길동')).toBeInTheDocument()
  })
})

describe('QuizReviewPage (전체관리자로 로그인)', () => {
  beforeEach(() => {
    saveAdminSession({ role: 'super-admin' })
  })

  it('모든 학교의 제출을 볼 수 있다', async () => {
    fetchAllQuestions.mockResolvedValue([songlimSubmission, jangangSubmission])
    renderPage()

    await waitFor(() => expect(screen.getByText('송림초 학생 제출 문제')).toBeInTheDocument())
    expect(screen.getByText('장항초 학생 제출 문제')).toBeInTheDocument()
  })

  it('요청이 없으면 안내 문구를 보여준다', async () => {
    fetchAllQuestions.mockResolvedValue([publishedQuestion])
    renderPage()
    await waitFor(() => expect(screen.getByText('검토할 요청이 없어요.')).toBeInTheDocument())
  })

  it('검토하기를 누르면 제출된 내용이 채워진 폼이 보이고, 저장하면 status:published로 publishQuestion이 호출된다', async () => {
    fetchAllQuestions.mockResolvedValue([songlimSubmission])
    publishQuestion.mockResolvedValue()
    renderPage()
    await waitFor(() => expect(screen.getByText('송림초 학생 제출 문제')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '검토하기' }))
    expect(screen.getByLabelText('문제')).toHaveValue('송림초 학생 제출 문제')

    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(publishQuestion).toHaveBeenCalledWith(
        'q1',
        expect.objectContaining({
          scope: 'lesson',
          refId: 'ecrimedia-u1-t5-l1',
          question: '송림초 학생 제출 문제',
          submittedBy: songlimSubmission.submittedBy,
        }),
      ),
    )
  })

  it('반려하면 deleteQuestion이 호출되고 목록에서 사라진다', async () => {
    fetchAllQuestions.mockResolvedValueOnce([songlimSubmission]).mockResolvedValueOnce([])
    deleteQuestion.mockResolvedValue()
    renderPage()
    await waitFor(() => expect(screen.getByText('송림초 학생 제출 문제')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '반려' }))

    await waitFor(() => expect(deleteQuestion).toHaveBeenCalledWith('q1'))
    await waitFor(() =>
      expect(screen.queryByText('송림초 학생 제출 문제')).not.toBeInTheDocument(),
    )
  })

  it('반려 확인 창에서 취소하면 삭제되지 않는다', async () => {
    window.confirm.mockReturnValue(false)
    fetchAllQuestions.mockResolvedValue([songlimSubmission])
    renderPage()
    await waitFor(() => expect(screen.getByText('송림초 학생 제출 문제')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '반려' }))

    expect(deleteQuestion).not.toHaveBeenCalled()
  })

  it('목록을 불러오지 못하면 에러 메시지를 보여준다', async () => {
    fetchAllQuestions.mockRejectedValue(new Error('network error'))
    renderPage()
    await waitFor(() => expect(screen.getByText('목록을 불러오지 못했어요.')).toBeInTheDocument())
  })
})
