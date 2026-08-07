import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LessonDetailPage from './LessonDetailPage.jsx'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import { saveSession } from '../lib/auth.js'

vi.mock('../lib/materialsRepo.js', () => ({
  fetchMaterialsForLesson: vi.fn(),
}))
vi.mock('../lib/quizzesRepo.js', () => ({
  fetchAllQuestions: vi.fn(),
}))

import { fetchMaterialsForLesson } from '../lib/materialsRepo.js'
import { fetchAllQuestions } from '../lib/quizzesRepo.js'

function renderPage(path) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/p/:publisherId/:unitId/:topicId/:lessonId"
            element={<LessonDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  fetchMaterialsForLesson.mockResolvedValue([])
  fetchAllQuestions.mockResolvedValue([])
  saveSession({
    schoolId: 'jangang-cho',
    schoolName: '장항초',
    publisherId: 'ecrimedia',
    studentName: '홍길동',
    role: 'student',
  })
})

describe('LessonDetailPage', () => {
  it('대단원명, 학습주제 제목, 차시순서/전체차시, 쪽수, 성취기준을 보여준다', async () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    expect(screen.getByText('1. 우리가 사는 곳')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '우리가 사는 곳에 있는 여러 장소를 표현해 볼까요' }),
    ).toBeInTheDocument()
    expect(screen.getByText('1 / 2차시 · 23~27쪽')).toBeInTheDocument()
    expect(
      screen.getByText(
        '[4사01-01] 주변 여러 장소에서의 경험과 느낌을 다양한 방식으로 표현하고, 장소감을 나누며 서로 존중하는 태도를 지닌다.',
      ),
    ).toBeInTheDocument()
    await waitFor(() => expect(fetchMaterialsForLesson).toHaveBeenCalled())
  })

  it('첫 차시에서는 이전 차시 링크가 없고 다음 차시 링크만 있다', () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    expect(screen.queryByRole('link', { name: '◀ 이전 차시' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '다음 차시 ▶' })).toHaveAttribute(
      'href',
      '/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l2',
    )
  })

  it('이 차시 퀴즈 만들기 링크가 항상 보인다(학생/교사 누구나 제출 가능)', () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    expect(screen.getByRole('link', { name: /이 차시 퀴즈 만들기/ })).toHaveAttribute(
      'href',
      '/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1/quiz-submit',
    )
  })

  it('자료를 불러오는 동안 로딩 문구를, 없으면 안내 문구를 보여준다', async () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')
    expect(screen.getByText('자료를 불러오는 중...')).toBeInTheDocument()

    await waitFor(() =>
      expect(screen.getByText('아직 연결된 서천 지역화 자료가 없어요.')).toBeInTheDocument(),
    )
  })

  it('학생으로 로그인하면 활용법이 보이지 않는다', async () => {
    fetchMaterialsForLesson.mockResolvedValue([
      {
        id: 'm1',
        usageNote: '교사만 볼 수 있는 활용법',
        usageFileUrl: 'https://drive.google.com/file/d/abc',
        resources: [{ type: 'photo', title: '자료 사진', url: 'https://example.com/a.jpg' }],
      },
    ])
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('자료 사진')).toBeInTheDocument())
    expect(screen.queryByText('교사만 볼 수 있는 활용법')).not.toBeInTheDocument()
    expect(screen.queryByText('📄 교사용 활용법 파일 열기')).not.toBeInTheDocument()
  })

  it('교사로 로그인하면 활용법과 활용법 파일 링크가 보인다', async () => {
    localStorage.clear()
    saveSession({
      schoolId: 'jangang-cho',
      schoolName: '장항초',
      publisherId: 'ecrimedia',
      studentName: '김선생',
      role: 'teacher',
    })
    fetchMaterialsForLesson.mockResolvedValue([
      {
        id: 'm1',
        usageNote: '교사만 볼 수 있는 활용법',
        usageFileUrl: 'https://drive.google.com/file/d/abc',
        resources: [],
      },
    ])
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('교사만 볼 수 있는 활용법')).toBeInTheDocument())
    expect(screen.getByText('📄 교사용 활용법 파일 열기')).toHaveAttribute(
      'href',
      'https://drive.google.com/file/d/abc',
    )
  })

  it('교사로 로그인해도 활용법 파일 링크가 http(s)가 아니면 보여주지 않는다', async () => {
    localStorage.clear()
    saveSession({
      schoolId: 'jangang-cho',
      schoolName: '장항초',
      publisherId: 'ecrimedia',
      studentName: '김선생',
      role: 'teacher',
    })
    fetchMaterialsForLesson.mockResolvedValue([
      {
        id: 'm1',
        usageNote: '교사만 볼 수 있는 활용법',
        usageFileUrl: 'javascript:alert(1)',
        resources: [],
      },
    ])
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('교사만 볼 수 있는 활용법')).toBeInTheDocument())
    expect(screen.queryByText('📄 교사용 활용법 파일 열기')).not.toBeInTheDocument()
  })

  it('연결된 자료가 있으면 자료 카드를 보여준다', async () => {
    fetchMaterialsForLesson.mockResolvedValue([
      {
        id: 'm1',
        usageNote: '',
        resources: [{ type: 'photo', title: '갈대밭 사진', url: 'https://example.com/a.jpg' }],
      },
    ])
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('갈대밭 사진')).toBeInTheDocument())
  })

  it('자료 문서에 resources 필드가 없어도 오류 없이 준비 중 문구를 보여준다', async () => {
    fetchMaterialsForLesson.mockResolvedValue([{ id: 'm1', usageNote: '' }])
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() =>
      expect(screen.getByText('자료 준비 중입니다.')).toBeInTheDocument(),
    )
  })

  it('자료를 불러오지 못하면 에러 안내를 보여준다', async () => {
    fetchMaterialsForLesson.mockRejectedValue(new Error('network error'))
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('자료를 불러오지 못했어요.')).toBeInTheDocument())
  })

  it('문제가 있는 범위의 퀴즈 링크를 보여준다 (학습주제 퀴즈는 대단원 퀴즈로도 롤업된다)', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'topic', refId: 'ecrimedia-u1-t5', type: 'ox', question: 'Q', answer: 'O' },
    ])
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() =>
      expect(screen.getByText('이 학습주제 퀴즈')).toHaveAttribute(
        'href',
        '/quiz/ecrimedia/topic/ecrimedia-u1-t5',
      ),
    )
    expect(screen.queryByText('이 차시 퀴즈')).not.toBeInTheDocument()
    expect(screen.getByText('이 대단원 퀴즈')).toHaveAttribute(
      'href',
      '/quiz/ecrimedia/unit/ecrimedia-u1',
    )
  })

  it('숨김(visible:false) 처리된 퀴즈만 있으면 링크를 보여주지 않는다', async () => {
    fetchAllQuestions.mockResolvedValue([
      {
        id: 'q1',
        scope: 'topic',
        refId: 'ecrimedia-u1-t5',
        type: 'ox',
        question: 'Q',
        answer: 'O',
        visible: false,
      },
    ])
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(fetchAllQuestions).toHaveBeenCalled())
    expect(screen.queryByText('이 학습주제 퀴즈')).not.toBeInTheDocument()
  })

  it('대단원 퀴즈 링크는 그 학습주제·차시에 딸린 퀴즈만 있어도 보인다 (롤업)', async () => {
    fetchAllQuestions.mockResolvedValue([
      {
        id: 'q1',
        scope: 'lesson',
        refId: 'ecrimedia-u1-t5-l1',
        type: 'ox',
        question: 'Q',
        answer: 'O',
      },
    ])
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() =>
      expect(screen.getByText('이 대단원 퀴즈')).toHaveAttribute(
        'href',
        '/quiz/ecrimedia/unit/ecrimedia-u1',
      ),
    )
  })

  it('자료가 없어도 보이는 퀴즈가 있으면 "자료 없음" 대신 퀴즈 안내 문구를 보여준다', async () => {
    fetchAllQuestions.mockResolvedValue([
      {
        id: 'q1',
        scope: 'lesson',
        refId: 'ecrimedia-u1-t5-l1',
        type: 'ox',
        question: 'Q',
        answer: 'O',
      },
    ])
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() =>
      expect(
        screen.getByText('이 차시에는 퀴즈만 준비되어 있어요. 아래에서 풀어보세요!'),
      ).toBeInTheDocument(),
    )
    expect(screen.queryByText('아직 연결된 서천 지역화 자료가 없어요.')).not.toBeInTheDocument()
  })

  it('차시를 빠르게 이동해 이전 차시 응답이 늦게 도착해도 최신 차시 데이터만 반영한다', async () => {
    let resolveFirstLessonMaterials
    const firstLessonPromise = new Promise((resolve) => {
      resolveFirstLessonMaterials = resolve
    })

    fetchMaterialsForLesson.mockImplementation((id) => {
      if (id === 'ecrimedia-u1-t5-l1') return firstLessonPromise
      if (id === 'ecrimedia-u1-t5-l2') {
        return Promise.resolve([
          {
            id: 'm2',
            usageNote: '',
            resources: [
              { type: 'photo', title: '두 번째 차시 사진', url: 'https://example.com/2.jpg' },
            ],
          },
        ])
      }
      return Promise.resolve([])
    })

    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    // 첫 번째 차시의 자료 요청이 아직 대기 중인 상태에서 다음 차시로 이동한다.
    fireEvent.click(screen.getByRole('link', { name: '다음 차시 ▶' }))

    await waitFor(() => expect(screen.getByText('두 번째 차시 사진')).toBeInTheDocument())

    // 이전(첫 번째) 차시의 응답이 뒤늦게 도착해도, 이미 벗어난 요청이므로 상태를 덮어써서는 안 된다.
    await act(async () => {
      resolveFirstLessonMaterials([
        {
          id: 'm1',
          usageNote: '',
          resources: [
            { type: 'photo', title: '첫 번째 차시 사진', url: 'https://example.com/1.jpg' },
          ],
        },
      ])
      await firstLessonPromise
      await Promise.resolve()
    })

    expect(screen.getByText('두 번째 차시 사진')).toBeInTheDocument()
    expect(screen.queryByText('첫 번째 차시 사진')).not.toBeInTheDocument()
  })
})
