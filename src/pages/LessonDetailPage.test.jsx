import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LessonDetailPage from './LessonDetailPage.jsx'

function renderPage(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/p/:publisherId/:unitId/:subunitId/:lessonId" element={<LessonDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LessonDetailPage', () => {
  it('매핑된 토픽 제목과 자료 준비 중 문구를 보여준다', () => {
    renderPage('/p/jihak/jihak-u1/jihak-u1-s1/jihak-u1-s1-l1')
    expect(screen.getByText('여러 장소에 대한 경험과 느낌 떠올리기 ①')).toBeInTheDocument()
    expect(screen.getByText('자료 준비 중입니다.')).toBeInTheDocument()
  })

  it('천재교과서의 병합된 차시는 매핑된 토픽 2개를 모두 보여준다', () => {
    renderPage('/p/chunjae/chunjae-u1/chunjae-u1-s1/chunjae-u1-s1-l1')
    expect(screen.getByText('여러 장소에 대한 경험과 느낌 떠올리기 ①')).toBeInTheDocument()
    expect(screen.getByText('여러 장소에 대한 경험과 느낌 떠올리기 ②')).toBeInTheDocument()
  })

  it('퀴즈 풀기 링크를 보여준다', () => {
    renderPage('/p/jihak/jihak-u1/jihak-u1-s1/jihak-u1-s1-l1')
    expect(screen.getByText('이 차시 퀴즈 풀기')).toHaveAttribute(
      'href',
      '/quiz/lesson/jihak-u1-s1-l1',
    )
  })
})
