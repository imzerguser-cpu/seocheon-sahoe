import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import SuperAdminPasswordPage from './SuperAdminPasswordPage.jsx'

vi.mock('../lib/auth.js', () => ({
  changeSuperAdminPassword: vi.fn(),
}))

import { changeSuperAdminPassword } from '../lib/auth.js'

function renderPage() {
  return render(
    <MemoryRouter>
      <SuperAdminPasswordPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SuperAdminPasswordPage', () => {
  it('현재 비밀번호와 새 비밀번호를 입력하고 저장하면 changeSuperAdminPassword가 호출된다', async () => {
    changeSuperAdminPassword.mockResolvedValue()
    renderPage()

    fireEvent.change(screen.getByLabelText('현재 비밀번호'), { target: { value: 'oldpw' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpw123' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호 확인'), { target: { value: 'newpw123' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(changeSuperAdminPassword).toHaveBeenCalledWith('oldpw', 'newpw123'),
    )
    expect(screen.getByRole('status')).toHaveTextContent('비밀번호를 바꿨어요')
  })

  it('새 비밀번호와 확인이 다르면 저장하지 않고 안내 문구를 보여준다', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('현재 비밀번호'), { target: { value: 'oldpw' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpw123' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호 확인'), { target: { value: 'differentpw' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(screen.getByRole('alert')).toHaveTextContent('새 비밀번호가 서로 달라요')
    expect(changeSuperAdminPassword).not.toHaveBeenCalled()
  })

  it('현재 비밀번호가 틀리면(재인증 실패) 에러 문구를 보여준다', async () => {
    changeSuperAdminPassword.mockRejectedValue(new Error('auth/wrong-password'))
    renderPage()

    fireEvent.change(screen.getByLabelText('현재 비밀번호'), { target: { value: 'wrongpw' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'newpw123' } })
    fireEvent.change(screen.getByLabelText('새 비밀번호 확인'), { target: { value: 'newpw123' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('현재 비밀번호를 확인해 주세요'),
    )
  })

  it('관리자 대시보드로 가는 뒤로가기 링크를 보여준다', () => {
    renderPage()
    expect(screen.getByRole('link', { name: '← 관리자 대시보드로' })).toHaveAttribute(
      'href',
      '/admin',
    )
  })
})
