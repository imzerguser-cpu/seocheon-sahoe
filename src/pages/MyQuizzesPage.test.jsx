import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import MyQuizzesPage from './MyQuizzesPage.jsx'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import { saveSession } from '../lib/auth.js'

vi.mock('../lib/quizzesRepo.js', () => ({
  fetchAllQuestions: vi.fn(),
  updateQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
}))

import { fetchAllQuestions, updateQuestion, deleteQuestion } from '../lib/quizzesRepo.js'

function renderPage() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <MyQuizzesPage />
      </MemoryRouter>
    </AuthProvider>,
  )
}

const myQuestion = {
  id: 'q1',
  scope: 'lesson',
  refId: 'ecrimedia-u1-t5-l1',
  type: 'ox',
  question: '내가 만든 문제',
  answer: 'O',
  status: 'pending',
  visible: true,
  submittedBy: { schoolId: 'songlim-cho', schoolName: '송림초등학교', studentName: '홍길동', role: 'student' },
}

const othersQuestion = {
  id: 'q2',
  scope: 'lesson',
  refId: 'ecrimedia-u1-t6-l1',
  type: 'ox',
  question: '다른 학생 문제',
  answer: 'X',
  status: 'published',
  submittedBy: { schoolId: 'songlim-cho', schoolName: '송림초등학교', studentName: '김철수', role: 'student' },
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  saveSession({
    schoolId: 'songlim-cho',
    schoolName: '송림초등학교',
    publisherId: 'ecrimedia',
    studentName: '홍길동',
    role: 'student',
  })
})

describe('MyQuizzesPage', () => {
  it('로그인한 학생/교사 본인이 만든 퀴즈만 보여준다', async () => {
    fetchAllQuestions.mockResolvedValue([myQuestion, othersQuestion])
    renderPage()

    await waitFor(() => expect(screen.getByText(/내가 만든 문제/)).toBeInTheDocument())
    expect(screen.queryByText(/다른 학생 문제/)).not.toBeInTheDocument()
  })

  it('만든 퀴즈가 없으면 안내 문구를 보여준다', async () => {
    fetchAllQuestions.mockResolvedValue([othersQuestion])
    renderPage()
    await waitFor(() =>
      expect(screen.getByText('아직 만든 퀴즈가 없어요.')).toBeInTheDocument(),
    )
  })

  it('수정하면 원래 scope/refId/status/submittedBy를 유지한 채 updateQuestion이 호출된다', async () => {
    fetchAllQuestions.mockResolvedValue([myQuestion])
    updateQuestion.mockResolvedValue()
    renderPage()
    await waitFor(() => expect(screen.getByText(/내가 만든 문제/)).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    fireEvent.change(screen.getByLabelText('문제'), { target: { value: '수정한 문제' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(updateQuestion).toHaveBeenCalledWith(
        'q1',
        expect.objectContaining({
          scope: 'lesson',
          refId: 'ecrimedia-u1-t5-l1',
          status: 'pending',
          visible: true,
          submittedBy: myQuestion.submittedBy,
          question: '수정한 문제',
        }),
      ),
    )
  })

  it('삭제하면 확인 후 deleteQuestion이 호출되고 목록에서 사라진다', async () => {
    fetchAllQuestions.mockResolvedValueOnce([myQuestion]).mockResolvedValueOnce([])
    deleteQuestion.mockResolvedValue()
    renderPage()
    await waitFor(() => expect(screen.getByText(/내가 만든 문제/)).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(deleteQuestion).toHaveBeenCalledWith('q1'))
    await waitFor(() => expect(screen.queryByText(/내가 만든 문제/)).not.toBeInTheDocument())
  })

  it('삭제 확인 창에서 취소하면 삭제되지 않는다', async () => {
    window.confirm.mockReturnValue(false)
    fetchAllQuestions.mockResolvedValue([myQuestion])
    renderPage()
    await waitFor(() => expect(screen.getByText(/내가 만든 문제/)).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    expect(deleteQuestion).not.toHaveBeenCalled()
  })

  it('검토 대기 중인 내 퀴즈는 상태 배지를 보여준다', async () => {
    fetchAllQuestions.mockResolvedValue([myQuestion])
    renderPage()
    await waitFor(() => expect(screen.getByText('검토 대기')).toBeInTheDocument())
  })
})
