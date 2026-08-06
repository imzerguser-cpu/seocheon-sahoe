import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LessonDetailPage from './LessonDetailPage.jsx'

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

describe('LessonDetailPage', () => {
  it('대단원명, 학습주제 제목, 차시순서/전체차시, 쪽수, 성취기준을 보여준다', () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    expect(screen.getByText('1. 우리가 사는 곳')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '우리가 사는 곳에 있는 여러 장소를 표현해 볼까요' })).toBeInTheDocument()
    expect(screen.getByText('1 / 2차시 · 23~27쪽')).toBeInTheDocument()
    expect(
      screen.getByText('[4사01-01] 주변 여러 장소에서의 경험과 느낌을 다양한 방식으로 표현하고, 장소감을 나누며 서로 존중하는 태도를 지닌다.'),
    ).toBeInTheDocument()
  })

  it('첫 차시에서는 이전 차시 링크가 없고 다음 차시 링크만 있다', () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    expect(screen.queryByRole('link', { name: '◀ 이전 차시' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '다음 차시 ▶' })).toHaveAttribute(
      'href',
      '/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l2',
    )
  })

  it('마지막 차시에서는 다음 차시 링크가 없고 이전 차시 링크만 있다', () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l2')

    expect(screen.queryByRole('link', { name: '다음 차시 ▶' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '◀ 이전 차시' })).toHaveAttribute(
      'href',
      '/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1',
    )
  })

  it('매핑된 서천 지역화 자료가 있으면 제목과 자료 상태를 보여준다', () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    // topic_1-1-3이 이 차시에 매핑되어 있다
    expect(screen.getByText('주변 여러 장소에서의 경험과 느낌 표현하기')).toBeInTheDocument()
    expect(screen.getByText('자료 준비 중입니다.')).toBeInTheDocument()
  })

  it('차시/학습주제/대단원 3단계 퀴즈 링크를 모두 보여준다', () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    expect(screen.getByText('이 차시 퀴즈')).toHaveAttribute(
      'href',
      '/quiz/lesson/ecrimedia-u1-t5-l1',
    )
    expect(screen.getByText('이 학습주제 퀴즈')).toHaveAttribute(
      'href',
      '/quiz/topic/ecrimedia-u1-t5',
    )
    expect(screen.getByText('이 대단원 퀴즈')).toHaveAttribute('href', '/quiz/unit/ecrimedia-u1')
  })
})
