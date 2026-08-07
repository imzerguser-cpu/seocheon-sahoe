import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './LoginPage.jsx'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import { getSession } from '../lib/auth.js'
import schools from '../data/schools.json'

vi.mock('../lib/schoolPasswordsRepo.js', () => ({
  fetchSchoolPasswords: vi.fn(),
}))

import { fetchSchoolPasswords } from '../lib/schoolPasswordsRepo.js'

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  fetchSchoolPasswords.mockResolvedValue(
    Object.fromEntries(schools.map((s) => [s.id, s.password])),
  )
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

function fullName(school) {
  return `${school.name}등학교`
}

describe('LoginPage', () => {
  it('지도에 모든 학교가 클릭 가능한 항목으로 나열된다', () => {
    renderLoginPage()
    for (const school of schools) {
      expect(screen.getByRole('button', { name: fullName(school) })).toBeInTheDocument()
    }
  })

  it('지도의 학교 그림을 클릭하면 그 학교가 선택되고, 선택한 학교 이름이 OO초등학교 형식으로 보인다', () => {
    renderLoginPage()
    const target = schools.find((s) => s.id === 'songlim-cho')

    fireEvent.click(screen.getByRole('button', { name: fullName(target) }))

    expect(screen.getByRole('button', { name: fullName(target) })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText(`선택한 학교: ${fullName(target)}`)).toBeInTheDocument()
  })

  it('서천초도 지도에서 클릭해서 선택할 수 있다', () => {
    renderLoginPage()
    const seocheon = schools.find((s) => s.id === 'seocheon-cho')

    fireEvent.click(screen.getByRole('button', { name: fullName(seocheon) }))

    expect(screen.getByText(`선택한 학교: ${fullName(seocheon)}`)).toBeInTheDocument()
  })

  it('올바른 학교 비밀번호를 입력하면(Firestore의 최신 비밀번호로 확인) 세션에 OO초등학교 전체 명칭이 저장되고 대단원 목록으로 이동한다', async () => {
    renderLoginPage()
    const firstSchool = schools[0]

    fireEvent.click(screen.getByRole('button', { name: fullName(firstSchool) }))
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: firstSchool.password } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    await waitFor(() => expect(screen.getByText('대단원 목록 페이지')).toBeInTheDocument())
    expect(fetchSchoolPasswords).toHaveBeenCalled()
    expect(getSession()).toEqual({
      schoolId: firstSchool.id,
      schoolName: fullName(firstSchool),
      publisherId: firstSchool.publisherId,
      studentName: '홍길동',
      role: 'student',
    })
  })

  it('"저는 선생님이에요" 체크박스를 선택하고 로그인하면 role이 teacher로 저장된다', async () => {
    renderLoginPage()
    const firstSchool = schools[0]

    fireEvent.click(screen.getByRole('button', { name: fullName(firstSchool) }))
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '김선생' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: firstSchool.password } })
    fireEvent.click(screen.getByLabelText('저는 선생님이에요'))
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    await waitFor(() =>
      expect(getSession()).toEqual({
        schoolId: firstSchool.id,
        schoolName: fullName(firstSchool),
        publisherId: firstSchool.publisherId,
        studentName: '김선생',
        role: 'teacher',
      }),
    )
  })

  it('틀린 비밀번호를 입력하면 에러 메시지를 보여주고 이동하지 않는다', async () => {
    renderLoginPage()
    const firstSchool = schools[0]

    fireEvent.click(screen.getByRole('button', { name: fullName(firstSchool) }))
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '완전히틀림' } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('비밀번호가 올바르지 않아요'),
    )
    expect(getSession()).toBeNull()
  })

  it('운영 중 학교 비밀번호가 바뀌었으면(schools.json의 예전 값이 아니라) 새 비밀번호로만 로그인된다', async () => {
    const firstSchool = schools[0]
    fetchSchoolPasswords.mockResolvedValue({
      ...Object.fromEntries(schools.map((s) => [s.id, s.password])),
      [firstSchool.id]: 'new-password',
    })
    renderLoginPage()

    fireEvent.click(screen.getByRole('button', { name: fullName(firstSchool) }))
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: firstSchool.password } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('비밀번호가 올바르지 않아요'),
    )

    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'new-password' } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    await waitFor(() => expect(screen.getByText('대단원 목록 페이지')).toBeInTheDocument())
  })

  it('관리자 로그인 화면으로 가는 링크를 보여준다', () => {
    renderLoginPage()
    expect(screen.getByRole('link', { name: '관리자 모드' })).toHaveAttribute(
      'href',
      '/admin/login',
    )
  })
})
