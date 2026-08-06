import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './LoginPage.jsx'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import { getSession } from '../lib/auth.js'
import schools from '../data/schools.json'

beforeEach(() => {
  localStorage.clear()
})

function renderLoginPage() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/p/:publisherId" element={<div>대단원 목록 페이지</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('LoginPage', () => {
  it('학교 선택 드롭다운에 모든 학교가 나열된다', () => {
    renderLoginPage()
    const select = screen.getByLabelText('학교')
    expect(select.options).toHaveLength(schools.length)
  })

  it('올바른 학교 비밀번호를 입력하면 세션이 저장되고 해당 출판사 대단원 목록으로 이동한다', () => {
    renderLoginPage()
    const firstSchool = schools[0]

    fireEvent.change(screen.getByLabelText('학교'), { target: { value: firstSchool.id } })
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: firstSchool.password } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    expect(screen.getByText('대단원 목록 페이지')).toBeInTheDocument()
    expect(getSession()).toEqual({
      schoolId: firstSchool.id,
      schoolName: firstSchool.name,
      publisherId: firstSchool.publisherId,
      studentName: '홍길동',
    })
  })

  it('틀린 비밀번호를 입력하면 에러 메시지를 보여주고 이동하지 않는다', () => {
    renderLoginPage()
    const firstSchool = schools[0]

    fireEvent.change(screen.getByLabelText('학교'), { target: { value: firstSchool.id } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '완전히틀림' } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    expect(screen.getByRole('alert')).toHaveTextContent('비밀번호가 올바르지 않아요')
    expect(getSession()).toBeNull()
  })
})
