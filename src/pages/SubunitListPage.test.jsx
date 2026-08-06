import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SubunitListPage from './SubunitListPage.jsx'

function renderWithRoute(publisherId, unitId) {
  return render(
    <MemoryRouter initialEntries={[`/p/${publisherId}/${unitId}`]}>
      <Routes>
        <Route path="/p/:publisherId/:unitId" element={<SubunitListPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SubunitListPage', () => {
  it('지학사 1단원의 소단원 목록을 보여준다', () => {
    renderWithRoute('jihak', 'jihak-u1')
    expect(screen.getByText('(1) 우리 주변의 장소')).toBeInTheDocument()
    expect(screen.getByText('(2) 살기 좋은 우리 지역')).toBeInTheDocument()
  })
})
