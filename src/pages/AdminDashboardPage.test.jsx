import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AdminDashboardPage from './AdminDashboardPage.jsx'

vi.mock('firebase/auth', () => ({ signOut: vi.fn() }))
vi.mock('../firebase.js', () => ({ auth: {} }))

describe('AdminDashboardPage', () => {
  it('비밀번호는 Firebase 콘솔에서 관리한다는 안내를 보여준다', () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Firebase 콘솔에서 직접 관리합니다/)).toBeInTheDocument()
  })
})
