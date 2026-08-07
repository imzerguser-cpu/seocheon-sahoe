import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminLoginPage from './AdminLoginPage.jsx'

vi.mock('../lib/adminConfigRepo.js', () => ({
  fetchAdminConfig: vi.fn(),
}))
vi.mock('../lib/auth.js', () => ({
  matchAdminPassword: vi.fn((config, input) => !!config && input === config.password),
  saveAdminSession: vi.fn(),
  signInSuperAdmin: vi.fn(),
}))

import { fetchAdminConfig } from '../lib/adminConfigRepo.js'
import { saveAdminSession, signInSuperAdmin } from '../lib/auth.js'

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/login']}>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<div>관리자 대시보드 페이지</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminLoginPage', () => {
  it('기본값은 학교관리자 탭이고 비밀번호 입력만 보인다', () => {
    renderPage()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.queryByLabelText('이메일')).not.toBeInTheDocument()
  })

  it('학교관리자: 올바른 비밀번호면 학교관리자 세션이 저장되고 대시보드로 이동한다', async () => {
    fetchAdminConfig.mockResolvedValue({ password: '20262026' })
    renderPage()

    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '20262026' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => expect(screen.getByText('관리자 대시보드 페이지')).toBeInTheDocument())
    expect(saveAdminSession).toHaveBeenCalledWith('school-admin')
  })

  it('학교관리자: 틀린 비밀번호면 에러를 보여준다', async () => {
    fetchAdminConfig.mockResolvedValue({ password: '20262026' })
    renderPage()

    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('비밀번호가 올바르지 않아요'),
    )
    expect(saveAdminSession).not.toHaveBeenCalled()
  })

  it('전체관리자 탭을 누르면 이메일/비밀번호 입력으로 바뀐다', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '전체관리자' }))
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
  })

  it('전체관리자: 로그인 성공하면 super-admin 세션이 저장되고 대시보드로 이동한다', async () => {
    signInSuperAdmin.mockResolvedValue(true)
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: '전체관리자' }))
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'pw123456' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => expect(screen.getByText('관리자 대시보드 페이지')).toBeInTheDocument())
    expect(saveAdminSession).toHaveBeenCalledWith('super-admin')
  })

  it('전체관리자: 로그인 실패하면 에러를 보여준다', async () => {
    signInSuperAdmin.mockResolvedValue(false)
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: '전체관리자' }))
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('로그인에 실패했어요'),
    )
  })
})
