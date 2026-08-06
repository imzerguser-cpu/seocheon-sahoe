import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LessonListPage from './LessonListPage.jsx'

function renderWithRoute(publisherId, unitId, subunitId) {
  return render(
    <MemoryRouter initialEntries={[`/p/${publisherId}/${unitId}/${subunitId}`]}>
      <Routes>
        <Route path="/p/:publisherId/:unitId/:subunitId" element={<LessonListPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LessonListPage', () => {
  it('지학사 1-1 소단원의 차시 목록을 보여준다', () => {
    renderWithRoute('jihak', 'jihak-u1', 'jihak-u1-s1')
    expect(screen.getByText('여러 장소에서의 경험 떠올리기')).toBeInTheDocument()
    expect(screen.getByText('장소에 대한 느낌 나누기')).toBeInTheDocument()
    expect(screen.getByText('경험과 느낌 표현하기')).toBeInTheDocument()
  })
})
