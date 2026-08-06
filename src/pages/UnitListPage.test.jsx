import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import UnitListPage from './UnitListPage.jsx'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import { saveSession } from '../lib/auth.js'

beforeEach(() => {
  localStorage.clear()
  saveSession({
    schoolId: 'jangang-cho',
    schoolName: '장항초',
    publisherId: 'ecrimedia',
    studentName: '홍길동',
  })
})

function renderWithRoute() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/p/ecrimedia']}>
        <Routes>
          <Route path="/p/:publisherId" element={<UnitListPage />} />
          <Route path="/login" element={<div>로그인 페이지</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('UnitListPage', () => {
  it('출판사 이름과 대단원 목록을 보여준다', () => {
    renderWithRoute()
    expect(screen.getByText('아이스크림미디어(한춘희)')).toBeInTheDocument()
    expect(screen.getByText('1. 우리가 사는 곳')).toBeInTheDocument()
  })

  it('로그인한 학교/학생 이름을 보여준다', () => {
    renderWithRoute()
    expect(screen.getByText('장항초 · 홍길동')).toBeInTheDocument()
  })

  it('로그아웃 버튼을 누르면 로그인 페이지로 이동한다', () => {
    renderWithRoute()
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument()
  })
})
