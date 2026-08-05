import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage.jsx'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import { fetchAccessConfig } from '../lib/accessConfig.js'

vi.mock('../lib/accessConfig.js', () => ({
  fetchAccessConfig: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

function renderLoginPage() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('LoginPage', () => {
  it('올바른 비밀번호를 입력하면 에러 메시지가 없다', async () => {
    fetchAccessConfig.mockResolvedValue({
      teacherPasscode: 'teach123',
      studentPasscode: 'stud123',
    })
    renderLoginPage()

    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'teach123' } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  it('틀린 비밀번호를 입력하면 에러 메시지를 보여준다', async () => {
    fetchAccessConfig.mockResolvedValue({
      teacherPasscode: 'teach123',
      studentPasscode: 'stud123',
    })
    renderLoginPage()

    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('비밀번호가 올바르지 않아요')
    })
  })
})
