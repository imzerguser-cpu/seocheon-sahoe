import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SuperAdminRoute from './SuperAdminRoute.jsx'
import { saveAdminSession } from '../lib/auth.js'

// SuperAdminRoute pulls in ../lib/auth.js, which imports ../firebase.js at module
// load time and calls getAuth(app) lazily inside signInSuperAdmin/signOutSuperAdmin.
// Mock at the Firebase SDK boundary only (matching src/lib/auth.test.js) so
// getAdminSession/saveAdminSession still run for real against localStorage.
vi.mock('../firebase.js', () => ({ app: {} }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn().mockResolvedValue(),
}))

beforeEach(() => {
  localStorage.clear()
})

function renderWithSession() {
  return render(
    <MemoryRouter initialEntries={['/admin/password']}>
      <Routes>
        <Route element={<SuperAdminRoute />}>
          <Route path="/admin/password" element={<div>비밀번호 변경 페이지</div>} />
        </Route>
        <Route path="/admin/login" element={<div>관리자 로그인 페이지</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SuperAdminRoute', () => {
  it('전체관리자 세션이면 자식 라우트를 보여준다', () => {
    saveAdminSession('super-admin')
    renderWithSession()
    expect(screen.getByText('비밀번호 변경 페이지')).toBeInTheDocument()
  })

  it('학교관리자 세션이면 관리자 로그인 페이지로 보낸다', () => {
    saveAdminSession('school-admin')
    renderWithSession()
    expect(screen.getByText('관리자 로그인 페이지')).toBeInTheDocument()
  })

  it('세션이 없으면 관리자 로그인 페이지로 보낸다', () => {
    renderWithSession()
    expect(screen.getByText('관리자 로그인 페이지')).toBeInTheDocument()
  })
})
