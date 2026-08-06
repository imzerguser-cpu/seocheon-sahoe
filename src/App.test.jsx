import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, callback) => {
    callback(null)
    return () => {}
  },
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('./firebase.js', () => ({ auth: {} }))

describe('App', () => {
  it('로그인 전에는 로그인 페이지로 리다이렉트된다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('우리 고장 서천 지역화 자료')).toBeInTheDocument()
  })

  it('알 수 없는 경로는 홈으로 리다이렉트된 뒤 로그인 페이지를 보여준다', () => {
    render(
      <MemoryRouter initialEntries={['/totally-unknown-path']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('우리 고장 서천 지역화 자료')).toBeInTheDocument()
  })
})
