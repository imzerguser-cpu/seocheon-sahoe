import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminLoginPage from './AdminLoginPage.jsx'
import { getAdminSession } from '../lib/auth.js'

beforeEach(() => {
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
  it('올바른 관리자 비밀번호를 입력하면 세션이 저장되고 대시보드로 이동한다', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '20262026' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(screen.getByText('관리자 대시보드 페이지')).toBeInTheDocument()
    expect(getAdminSession()).toBe(true)
  })

  it('틀린 비밀번호를 입력하면 에러 메시지를 보여준다', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(screen.getByRole('alert')).toHaveTextContent('비밀번호가 올바르지 않아요')
    expect(getAdminSession()).toBe(false)
  })
})
