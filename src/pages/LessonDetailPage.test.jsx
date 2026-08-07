import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LessonDetailPage from './LessonDetailPage.jsx'

vi.mock('../lib/materialsRepo.js', () => ({
  fetchMaterialsForLesson: vi.fn(),
}))
vi.mock('../lib/quizzesRepo.js', () => ({
  fetchQuestions: vi.fn(),
}))

import { fetchMaterialsForLesson } from '../lib/materialsRepo.js'
import { fetchQuestions } from '../lib/quizzesRepo.js'

function renderPage(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/p/:publisherId/:unitId/:topicId/:lessonId"
          element={<LessonDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchMaterialsForLesson.mockResolvedValue([])
  fetchQuestions.mockResolvedValue([])
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

  it('자료를 불러오는 동안 로딩 문구를, 없으면 안내 문구를 보여준다', async () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')
    expect(screen.getByText('자료를 불러오는 중...')).toBeInTheDocument()

    await waitFor(() =>
      expect(screen.getByText('아직 연결된 서천 지역화 자료가 없어요.')).toBeInTheDocument(),
    )
  })

  it('연결된 자료가 있으면 제목과 자료 카드를 보여준다', async () => {
    fetchMaterialsForLesson.mockResolvedValue([
      {
        id: 'm1',
        title: '주변 여러 장소에서의 경험과 느낌 표현하기',
        usageNote: '',
        resources: [],
      },
    ])
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() =>
      expect(
        screen.getByText('주변 여러 장소에서의 경험과 느낌 표현하기'),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText('자료 준비 중입니다.')).toBeInTheDocument()
  })

  it('자료를 불러오지 못하면 에러 안내를 보여준다', async () => {
    fetchMaterialsForLesson.mockRejectedValue(new Error('network error'))
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('자료를 불러오지 못했어요.')).toBeInTheDocument())
  })

  it('문제가 있는 범위의 퀴즈 링크만 보여준다', async () => {
    fetchQuestions.mockImplementation((scope) =>
      Promise.resolve(scope === 'topic' ? [{ id: 'q1' }] : []),
    )
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() =>
      expect(screen.getByText('이 학습주제 퀴즈')).toHaveAttribute(
        'href',
        '/quiz/topic/ecrimedia-u1-t5',
      ),
    )
    expect(screen.queryByText('이 차시 퀴즈')).not.toBeInTheDocument()
    expect(screen.queryByText('이 대단원 퀴즈')).not.toBeInTheDocument()
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
          { id: 'm2', title: '두 번째 차시 자료', usageNote: '', resources: [] },
        ])
      }
      return Promise.resolve([])
    })

    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    // 첫 번째 차시의 자료 요청이 아직 대기 중인 상태에서 다음 차시로 이동한다.
    fireEvent.click(screen.getByRole('link', { name: '다음 차시 ▶' }))

    await waitFor(() => expect(screen.getByText('두 번째 차시 자료')).toBeInTheDocument())

    // 이전(첫 번째) 차시의 응답이 뒤늦게 도착해도, 이미 벗어난 요청이므로 상태를 덮어써서는 안 된다.
    await act(async () => {
      resolveFirstLessonMaterials([
        { id: 'm1', title: '첫 번째 차시 자료', usageNote: '', resources: [] },
      ])
      await firstLessonPromise
      await Promise.resolve()
    })

    expect(screen.getByText('두 번째 차시 자료')).toBeInTheDocument()
    expect(screen.queryByText('첫 번째 차시 자료')).not.toBeInTheDocument()
  })
})
