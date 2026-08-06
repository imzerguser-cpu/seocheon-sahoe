import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AdminLoginPage from './AdminLoginPage.jsx'
import { signInWithEmailAndPassword } from 'firebase/auth'

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  getAuth: vi.fn(() => ({})),
}))
vi.mock('../firebase.js', () => ({ auth: {} }))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AdminLoginPage', () => {
  it('로그인 실패 시 에러 메시지를 보여준다', async () => {
    signInWithEmailAndPassword.mockRejectedValue(new Error('bad credentials'))
    render(
      <MemoryRouter>
        <AdminLoginPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('로그인에 실패했어요')
    })
  })
})
