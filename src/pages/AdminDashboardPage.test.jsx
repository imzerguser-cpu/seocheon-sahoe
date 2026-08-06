import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminDashboardPage from './AdminDashboardPage.jsx'
import { saveAdminSession, getAdminSession } from '../lib/auth.js'

beforeEach(() => {
  localStorage.clear()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/login" element={<div>관리자 로그인 페이지</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminDashboardPage', () => {
  it('학교/관리자 비밀번호는 JSON 파일에서 직접 관리한다는 안내를 보여준다', () => {
    renderPage()
    expect(screen.getByText(/schools\.json/)).toBeInTheDocument()
    expect(screen.getByText(/adminConfig\.json/)).toBeInTheDocument()
  })

  it('로그아웃 버튼을 누르면 관리자 세션이 지워지고 관리자 로그인 페이지로 이동한다', () => {
    saveAdminSession()
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(screen.getByText('관리자 로그인 페이지')).toBeInTheDocument()
    expect(getAdminSession()).toBe(false)
  })
})
