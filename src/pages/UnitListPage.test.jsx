import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import UnitListPage from './UnitListPage.jsx'

function renderWithRoute(publisherId) {
  return render(
    <MemoryRouter initialEntries={[`/p/${publisherId}`]}>
      <Routes>
        <Route path="/p/:publisherId" element={<UnitListPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('UnitListPage', () => {
  it('지학사의 대단원 목록을 보여준다', () => {
    renderWithRoute('jihak')
    expect(screen.getByText('1. 우리가 사는 곳')).toBeInTheDocument()
  })
})
