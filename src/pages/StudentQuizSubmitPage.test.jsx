import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import StudentQuizSubmitPage from './StudentQuizSubmitPage.jsx'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import { saveSession } from '../lib/auth.js'

vi.mock('../lib/quizzesRepo.js', () => ({
  createQuestion: vi.fn(),
}))

import { createQuestion } from '../lib/quizzesRepo.js'

function renderPage() {
  return render(
    <AuthProvider>
      <MemoryRouter
        initialEntries={['/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1/quiz-submit']}
      >
        <Routes>
          <Route
            path="/p/:publisherId/:unitId/:topicId/:lessonId/quiz-submit"
            element={<StudentQuizSubmitPage />}
          />
          <Route
            path="/p/:publisherId/:unitId/:topicId/:lessonId"
            element={<div>차시 상세 페이지</div>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  saveSession({
    schoolId: 'songlim-cho',
    schoolName: '송림초등학교',
    publisherId: 'ecrimedia',
    studentName: '홍길동',
    role: 'student',
  })
})

describe('StudentQuizSubmitPage', () => {
  it('제출하면 상태는 pending, submittedBy는 로그인한 학생 정보로 createQuestion이 호출된다', async () => {
    createQuestion.mockResolvedValue('new-id')
    renderPage()

    fireEvent.change(screen.getByLabelText('문제 유형'), { target: { value: 'ox' } })
    fireEvent.change(screen.getByLabelText('문제'), { target: { value: '학생이 만든 문제' } })
    fireEvent.click(screen.getByLabelText('정답: O'))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(createQuestion).toHaveBeenCalled())
    const [questionArg, optionsArg] = createQuestion.mock.calls[0]
    expect(questionArg).toEqual({
      scope: 'lesson',
      refId: 'ecrimedia-u1-t5-l1',
      type: 'ox',
      question: '학생이 만든 문제',
      answer: 'O',
    })
    expect(optionsArg).toEqual({
      status: 'pending',
      submittedBy: {
        schoolId: 'songlim-cho',
        schoolName: '송림초등학교',
        studentName: '홍길동',
        role: 'student',
      },
    })
  })

  it('제출 후에는 검토 요청 안내와 차시로 돌아가는 링크를 보여준다', async () => {
    createQuestion.mockResolvedValue('new-id')
    renderPage()

    fireEvent.change(screen.getByLabelText('문제 유형'), { target: { value: 'ox' } })
    fireEvent.change(screen.getByLabelText('문제'), { target: { value: '문제' } })
    fireEvent.click(screen.getByLabelText('정답: O'))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(screen.getByText(/검토 요청을 보냈어요/)).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByRole('link', { name: '← 차시로 돌아가기' }))
    expect(screen.getByText('차시 상세 페이지')).toBeInTheDocument()
  })

  it('제출에 실패하면 에러 메시지를 보여주고 폼이 유지된다', async () => {
    createQuestion.mockRejectedValue(new Error('network error'))
    renderPage()

    fireEvent.change(screen.getByLabelText('문제 유형'), { target: { value: 'ox' } })
    fireEvent.change(screen.getByLabelText('문제'), { target: { value: '문제' } })
    fireEvent.click(screen.getByLabelText('정답: O'))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('퀴즈 제출에 실패했어요'),
    )
    expect(screen.getByLabelText('문제')).toHaveValue('문제')
  })

  it('승인 전에는 다른 학생에게 보이지 않는다는 안내 문구를 보여준다', () => {
    renderPage()
    expect(
      screen.getByText(/선생님이나 관리자가 확인한 뒤에 다른 학생들에게 보여요/),
    ).toBeInTheDocument()
  })

  it('취소하면 차시로 돌아간다', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(screen.getByText('차시 상세 페이지')).toBeInTheDocument()
  })
})
