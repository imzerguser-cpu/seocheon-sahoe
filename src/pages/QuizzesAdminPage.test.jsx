import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import QuizzesAdminPage from './QuizzesAdminPage.jsx'
import { saveAdminSession } from '../lib/auth.js'

function renderPage() {
  return render(
    <MemoryRouter>
      <QuizzesAdminPage />
    </MemoryRouter>,
  )
}

vi.mock('../lib/quizzesRepo.js', () => ({
  fetchAllQuestions: vi.fn(),
  createQuestion: vi.fn(),
  updateQuestion: vi.fn(),
  setQuestionVisibility: vi.fn(),
  deleteQuestion: vi.fn(),
}))

import {
  fetchAllQuestions,
  createQuestion,
  updateQuestion,
  setQuestionVisibility,
  deleteQuestion,
} from '../lib/quizzesRepo.js'

function selectTarget() {
  fireEvent.change(screen.getByLabelText('출판사'), { target: { value: 'ecrimedia' } })
  fireEvent.change(screen.getByLabelText('대단원'), { target: { value: 'ecrimedia-u1' } })
  fireEvent.change(screen.getByLabelText('학습주제'), { target: { value: 'ecrimedia-u1-t2' } })
  fireEvent.change(screen.getByLabelText('차시'), { target: { value: 'ecrimedia-u1-t2-l1' } })
}

// '장소에 대해 알아볼까요' == ecrimedia-u1-t2, its only lesson is ecrimedia-u1-t2-l1.
async function openTargetTopicGroup() {
  await waitFor(() => expect(fetchAllQuestions).toHaveBeenCalled())
  fireEvent.click(screen.getByRole('button', { name: /장소에 대해 알아볼까요/ }))
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  fetchAllQuestions.mockResolvedValue([])
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('QuizzesAdminPage', () => {
  it('대단원의 학습주제가 아코디언으로 전체 나열되고, 문제가 없으면 (0)으로 보인다', async () => {
    renderPage()
    await waitFor(() => expect(fetchAllQuestions).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: '이 대단원 전체 퀴즈 (0)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '단원 학습 내용 예상하기 (0)' })).toBeInTheDocument()
  })

  it('학습주제에 문제가 있으면 아코디언 헤더에 그 개수가 (N) 형식으로 보인다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'qt1', scope: 'topic', refId: 'ecrimedia-u1-t2', type: 'ox', question: '학습주제 문제', answer: 'O' },
      { id: 'ql1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '차시 문제', answer: 'X' },
    ])
    renderPage()
    selectTarget()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '장소에 대해 알아볼까요 (2)' })).toBeInTheDocument(),
    )
  })

  it('학습주제에서 만든 퀴즈는 자동으로 대단원 전체 퀴즈 개수에도 포함된다(롤업)', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'qt1', scope: 'topic', refId: 'ecrimedia-u1-t2', type: 'ox', question: '학습주제 문제', answer: 'O' },
    ])
    renderPage()
    selectTarget()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: '이 대단원 전체 퀴즈 (1)' })).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: '이 대단원 전체 퀴즈 (1)' }))
    expect(screen.getByText(/학습주제 문제/)).toBeInTheDocument()
  })

  it('각 퀴즈에는 "학생에게 보이기" 체크박스가 있고, 기본은 체크되어 있다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '문제', answer: 'O' },
    ])
    renderPage()
    selectTarget()
    await openTargetTopicGroup()

    expect(screen.getByLabelText('학생에게 보이기')).toBeChecked()
  })

  it('"학생에게 보이기" 체크를 해제하면 setQuestionVisibility(id, false)가 호출된다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '문제', answer: 'O' },
    ])
    setQuestionVisibility.mockResolvedValue()
    renderPage()
    selectTarget()
    await openTargetTopicGroup()

    fireEvent.click(screen.getByLabelText('학생에게 보이기'))

    await waitFor(() => expect(setQuestionVisibility).toHaveBeenCalledWith('q1', false))
  })

  it('이미 숨겨진(visible:false) 퀴즈는 체크박스가 해제되어 있고, 다시 누르면 true로 되돌린다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '문제', answer: 'O', visible: false },
    ])
    setQuestionVisibility.mockResolvedValue()
    renderPage()
    selectTarget()
    await openTargetTopicGroup()

    expect(screen.getByLabelText('학생에게 보이기')).not.toBeChecked()

    fireEvent.click(screen.getByLabelText('학생에게 보이기'))

    await waitFor(() => expect(setQuestionVisibility).toHaveBeenCalledWith('q1', true))
  })

  it('수정 폼에서 저장해도(visible을 건드리지 않는 한) 기존 visible 값이 유지된다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '문제', answer: 'O', visible: false },
    ])
    updateQuestion.mockResolvedValue()
    renderPage()
    selectTarget()
    await openTargetTopicGroup()

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(updateQuestion).toHaveBeenCalledWith(
        'q1',
        expect.objectContaining({ visible: false }),
      ),
    )
  })

  it('학습주제를 클릭하면 그 학습주제(topic 범위)와 그 안의 각 차시(lesson 범위)의 문제를 모두 보여준다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'qt1', scope: 'topic', refId: 'ecrimedia-u1-t2', type: 'ox', question: '학습주제 문제', answer: 'O' },
      { id: 'ql1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '차시 문제', answer: 'X' },
    ])
    renderPage()
    selectTarget()
    await openTargetTopicGroup()

    expect(screen.getByText(/학습주제 문제/)).toBeInTheDocument()
    expect(screen.getByText(/차시 문제/)).toBeInTheDocument()
  })

  it('검토 대기(status:pending) 문제는 "검토 대기" 배지와 제출자(학교·이름)를 함께 보여준다', async () => {
    fetchAllQuestions.mockResolvedValue([
      {
        id: 'q1',
        scope: 'lesson',
        refId: 'ecrimedia-u1-t2-l1',
        type: 'ox',
        question: '학생 제출 문제',
        answer: 'O',
        status: 'pending',
        submittedBy: { schoolId: 'songlim-cho', schoolName: '송림초등학교', studentName: '홍길동', role: 'student' },
      },
    ])
    renderPage()
    selectTarget()
    await openTargetTopicGroup()

    expect(screen.getByText('검토 대기')).toBeInTheDocument()
    expect(screen.getByText('제출: 송림초등학교 · 홍길동')).toBeInTheDocument()
  })

  it('관리자가 직접 만든(제출자 없는) 문제는 제출자 표시가 보이지 않는다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '관리자 문제', answer: 'O' },
    ])
    renderPage()
    selectTarget()
    await openTargetTopicGroup()

    expect(screen.queryByText(/제출:/)).not.toBeInTheDocument()
    expect(screen.queryByText('검토 대기')).not.toBeInTheDocument()
  })

  it('학습주제에 등록된 문제가 없으면 안내 문구를 보여준다', async () => {
    renderPage()
    selectTarget()
    await openTargetTopicGroup()

    expect(screen.getByText('이 범위에는 아직 등록된 문제가 없어요.')).toBeInTheDocument()
  })

  it('"이 대단원 전체 퀴즈"를 클릭하면 unit 범위 문제를 보여준다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'qu1', scope: 'unit', refId: 'ecrimedia-u1', type: 'ox', question: '대단원 문제', answer: 'O' },
    ])
    renderPage()
    fireEvent.change(screen.getByLabelText('출판사'), { target: { value: 'ecrimedia' } })
    await waitFor(() => expect(fetchAllQuestions).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: /이 대단원 전체 퀴즈/ }))

    expect(screen.getByText(/대단원 문제/)).toBeInTheDocument()
  })

  it('문제를 클릭하면 아코디언으로 펼쳐져 객관식 보기와 정답이 모두 보인다', async () => {
    fetchAllQuestions.mockResolvedValue([
      {
        id: 'ql1',
        scope: 'lesson',
        refId: 'ecrimedia-u1-t2-l1',
        type: 'multiple-choice',
        question: '객관식 문제',
        choices: ['보기1', '보기2'],
        answerIndex: 1,
      },
    ])
    renderPage()
    selectTarget()
    await openTargetTopicGroup()
    expect(screen.getByText(/객관식 문제/)).toBeInTheDocument()

    expect(screen.queryByText('보기1')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText(/객관식 문제/))

    expect(screen.getByText(/⬜ 보기1/)).toBeInTheDocument()
    expect(screen.getByText(/✅ 보기2/)).toBeInTheDocument()
  })

  it('문제를 클릭하면 OX 문제의 정답도 펼쳐서 보여준다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'ql1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: 'OX 문제', answer: 'X' },
    ])
    renderPage()
    selectTarget()
    await openTargetTopicGroup()
    expect(screen.getByText(/OX 문제/)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/OX 문제/))

    expect(screen.getByText('정답: X')).toBeInTheDocument()
  })

  it('문제 목록을 불러오는 동안 로딩 문구를 보여준다', async () => {
    let resolveFetch
    fetchAllQuestions.mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve }),
    )
    renderPage()

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()

    await act(async () => {
      resolveFetch([])
      await Promise.resolve()
    })
    expect(screen.queryByText('불러오는 중...')).not.toBeInTheDocument()
  })

  it('문제 목록을 불러오지 못하면 에러 메시지를 보여준다', async () => {
    fetchAllQuestions.mockRejectedValue(new Error('network error'))
    renderPage()

    await waitFor(() =>
      expect(screen.getByText('문제 목록을 불러오지 못했어요.')).toBeInTheDocument(),
    )
  })

  it('문제 저장이 실패하면 폼이 유지되고 에러 메시지를 보여준다', async () => {
    createQuestion.mockRejectedValue(new Error('write failed'))
    renderPage()
    selectTarget()

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
    renderPage()
    selectTarget()

    fireEvent.click(screen.getByRole('button', { name: '새 문제 추가' }))
    expect(screen.getByRole('link', { name: '← 관리자 대시보드로' })).toHaveAttribute('href', '/admin')
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
        choices: [
          { text: '보기1', imageUrl: '' },
          { text: '보기2', imageUrl: '' },
        ],
        answerIndex: 1,
      }),
    )
  })

  it('보기에 이미지 링크를 함께 추가할 수 있고, 링크가 http(s)가 아니면 안내 문구를 보여준다', async () => {
    createQuestion.mockResolvedValue('new-id')
    renderPage()
    selectTarget()

    fireEvent.click(screen.getByRole('button', { name: '새 문제 추가' }))
    fireEvent.change(screen.getByLabelText('문제 유형'), { target: { value: 'multiple-choice' } })
    fireEvent.change(screen.getByLabelText('문제'), { target: { value: '유적 사진 문제' } })

    fireEvent.change(screen.getByLabelText('보기 텍스트'), { target: { value: '첨성대' } })
    fireEvent.change(screen.getByLabelText('보기 이미지 링크 (선택)'), {
      target: { value: 'javascript:alert(1)' },
    })
    fireEvent.click(screen.getByRole('button', { name: '보기 추가' }))
    expect(
      screen.getByText('http:// 또는 https://로 시작하는 링크만 추가할 수 있어요.'),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('보기 이미지 링크 (선택)'), {
      target: { value: 'https://example.com/cheomseongdae.jpg' },
    })
    fireEvent.click(screen.getByRole('button', { name: '보기 추가' }))
    fireEvent.change(screen.getByLabelText('보기 텍스트'), { target: { value: '첨성대 아님' } })
    fireEvent.click(screen.getByRole('button', { name: '보기 추가' }))
    fireEvent.click(screen.getByLabelText('정답: 첨성대'))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(createQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          choices: [
            { text: '첨성대', imageUrl: 'https://example.com/cheomseongdae.jpg' },
            { text: '첨성대 아님', imageUrl: '' },
          ],
        }),
      ),
    )
  })

  it('OX 문제를 만들면 answer:"O"|"X"로 createQuestion을 호출한다', async () => {
    createQuestion.mockResolvedValue('new-id')
    renderPage()
    selectTarget()

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
    renderPage()
    selectTarget()

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

  it('문제 텍스트가 비어있으면 저장 버튼이 비활성화되고, 입력하면 활성화된다', async () => {
    renderPage()
    selectTarget()

    fireEvent.click(screen.getByRole('button', { name: '새 문제 추가' }))
    fireEvent.change(screen.getByLabelText('문제 유형'), { target: { value: 'short-answer' } })
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('문제'), { target: { value: '질문' } })
    fireEvent.change(screen.getByLabelText('정답'), { target: { value: '답' } })
    expect(screen.getByRole('button', { name: '저장' })).not.toBeDisabled()
  })

  it('OX 문제는 O/X를 고르지 않으면 저장 버튼이 비활성화된다', async () => {
    renderPage()
    selectTarget()

    fireEvent.click(screen.getByRole('button', { name: '새 문제 추가' }))
    fireEvent.change(screen.getByLabelText('문제 유형'), { target: { value: 'ox' } })
    fireEvent.change(screen.getByLabelText('문제'), { target: { value: 'OX 질문' } })
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()

    fireEvent.click(screen.getByLabelText('정답: O'))
    expect(screen.getByRole('button', { name: '저장' })).not.toBeDisabled()
  })

  it('객관식 문제는 보기가 2개 미만이면 저장 버튼이 비활성화된다', async () => {
    renderPage()
    selectTarget()

    fireEvent.click(screen.getByRole('button', { name: '새 문제 추가' }))
    fireEvent.change(screen.getByLabelText('문제 유형'), { target: { value: 'multiple-choice' } })
    fireEvent.change(screen.getByLabelText('문제'), { target: { value: '질문입니다' } })
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('보기 텍스트'), { target: { value: '보기1' } })
    fireEvent.click(screen.getByRole('button', { name: '보기 추가' }))
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('보기 텍스트'), { target: { value: '보기2' } })
    fireEvent.click(screen.getByRole('button', { name: '보기 추가' }))
    expect(screen.getByRole('button', { name: '저장' })).not.toBeDisabled()
  })

  it('수정 버튼을 누르면 기존 값이 채워진 폼이 보인다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '문제입니다', answer: 'O' },
    ])
    renderPage()
    selectTarget()
    await openTargetTopicGroup()
    fireEvent.click(screen.getByText(/문제입니다/))

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    expect(screen.getByLabelText('문제')).toHaveValue('문제입니다')
  })

  it('수정 폼에서 저장하면 문제 자신의 scope/refId로 updateQuestion이 호출된다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'topic', refId: 'ecrimedia-u1-t2', type: 'ox', question: '학습주제 문제', answer: 'O' },
    ])
    updateQuestion.mockResolvedValue()
    renderPage()
    // 상단 새 문제 만들기 대상은 lesson으로 두고, 실제로 수정하는 문제는 topic 범위인 상황을 재현한다.
    selectTarget()
    await openTargetTopicGroup()
    fireEvent.click(screen.getByText(/학습주제 문제/))

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(updateQuestion).toHaveBeenCalledWith(
        'q1',
        expect.objectContaining({ scope: 'topic', refId: 'ecrimedia-u1-t2' }),
      ),
    )
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
    fetchAllQuestions.mockResolvedValueOnce([sampleQuestion]).mockResolvedValueOnce([])
    deleteQuestion.mockResolvedValue()
    renderPage()
    selectTarget()
    await openTargetTopicGroup()
    fireEvent.click(screen.getByText(/문제입니다/))
    expect(screen.getByText('정답: O')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(deleteQuestion).toHaveBeenCalledWith('q1'))
    await waitFor(() => expect(fetchAllQuestions).toHaveBeenCalledTimes(2))
    expect(screen.getByText('이 범위에는 아직 등록된 문제가 없어요.')).toBeInTheDocument()
  })

  it('삭제 확인 창에서 취소하면 deleteQuestion이 호출되지 않는다', async () => {
    window.confirm.mockReturnValue(false)
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '문제입니다', answer: 'O' },
    ])
    renderPage()
    selectTarget()
    await openTargetTopicGroup()

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))

    expect(deleteQuestion).not.toHaveBeenCalled()
    expect(screen.getByText(/문제입니다/)).toBeInTheDocument()
  })

  it('학교관리자로 로그인하면 출판사 선택이 소속 학교가 쓰는 출판사로 기본 설정된다', async () => {
    saveAdminSession({
      role: 'school-admin',
      schoolId: 'jangang-cho',
      schoolName: '장항초등학교',
      teacherName: '김선생',
    })
    renderPage()
    // schools.json: jangang-cho → ecrimedia
    await waitFor(() => expect(screen.getByLabelText('출판사')).toHaveValue('ecrimedia'))
  })
})
