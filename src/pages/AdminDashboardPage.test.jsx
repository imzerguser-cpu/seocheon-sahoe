import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminDashboardPage from './AdminDashboardPage.jsx'

vi.mock('../firebase.js', () => ({ app: {} }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn().mockResolvedValue(),
}))

// auth.js itself is NOT mocked — saveAdminSession/getAdminSession/clearAdminSession
// run for real against localStorage. Only its Firebase dependency is mocked above,
// so signOutSuperAdmin() also runs for real and calls the mocked firebase/auth signOut.
import { saveAdminSession, getAdminSession } from '../lib/auth.js'
import { signOut } from 'firebase/auth'

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
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
  it('자료 관리, 퀴즈 관리 링크를 보여준다', () => {
    saveAdminSession('school-admin')
    renderPage()
    expect(screen.getByRole('link', { name: '자료 관리' })).toHaveAttribute(
      'href',
      '/admin/materials',
    )
    expect(screen.getByRole('link', { name: '퀴즈 관리' })).toHaveAttribute(
      'href',
      '/admin/quizzes',
    )
  })

  it('학교관리자로 로그인하면 비밀번호 변경 링크가 안 보인다', () => {
    saveAdminSession('school-admin')
    renderPage()
    expect(screen.queryByRole('link', { name: '학교관리자 비밀번호 변경' })).not.toBeInTheDocument()
  })

  it('전체관리자로 로그인하면 비밀번호 변경 링크가 보인다', () => {
    saveAdminSession('super-admin')
    renderPage()
    expect(screen.getByRole('link', { name: '학교관리자 비밀번호 변경' })).toHaveAttribute(
      'href',
      '/admin/password',
    )
  })

  it('로그아웃 버튼을 누르면 세션이 지워지고 로그인 페이지로 이동한다', () => {
    saveAdminSession('school-admin')
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(screen.getByText('관리자 로그인 페이지')).toBeInTheDocument()
    expect(getAdminSession()).toBeNull()
  })

  it('전체관리자로 로그아웃하면 Firebase signOut도 호출한다', () => {
    saveAdminSession('super-admin')
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(signOut).toHaveBeenCalled()
  })
})
