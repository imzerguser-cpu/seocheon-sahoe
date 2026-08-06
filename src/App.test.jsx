import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'

describe('App', () => {
  it('루트 경로는 로그인 페이지로 리다이렉트된다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('우리 고장 서천 지역화 자료')).toBeInTheDocument()
  })

  it('알 수 없는 경로도 로그인 페이지로 리다이렉트된다', () => {
    render(
      <MemoryRouter initialEntries={['/totally-unknown-path']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('우리 고장 서천 지역화 자료')).toBeInTheDocument()
  })

  it('세션 없이 대단원 목록에 접근하면 로그인 페이지로 리다이렉트된다', () => {
    render(
      <MemoryRouter initialEntries={['/p/ecrimedia']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('우리 고장 서천 지역화 자료')).toBeInTheDocument()
  })

  it('관리자 경로는 관리자 세션이 없으면 관리자 로그인 페이지로 리다이렉트된다', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('관리자 로그인')).toBeInTheDocument()
  })
})
