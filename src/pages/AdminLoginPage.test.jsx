import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminLoginPage from './AdminLoginPage.jsx'

vi.mock('../lib/schoolPasswordsRepo.js', () => ({
  fetchSchoolAdminPasswords: vi.fn(),
}))
vi.mock('../lib/auth.js', () => ({
  saveAdminSession: vi.fn(),
  signInSuperAdmin: vi.fn(),
  sendSuperAdminPasswordReset: vi.fn(),
}))

import { fetchSchoolAdminPasswords } from '../lib/schoolPasswordsRepo.js'
import {
  saveAdminSession,
  signInSuperAdmin,
  sendSuperAdminPasswordReset,
} from '../lib/auth.js'

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  fetchSchoolAdminPasswords.mockResolvedValue({ 'songlim-cho': '20262026' })
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
  it('기본값은 학교관리자 탭이고 학교/담당자 이름/비밀번호 입력이 보인다', () => {
    renderPage()
    expect(screen.getByLabelText('학교')).toBeInTheDocument()
    expect(screen.getByLabelText('담당자 이름')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.queryByLabelText('이메일')).not.toBeInTheDocument()
  })

  it('학교 선택 목록은 OO초등학교 전체 명칭으로 보인다', () => {
    renderPage()
    expect(screen.getByRole('option', { name: '송림초등학교' })).toBeInTheDocument()
  })

  it('학교관리자: 올바른 비밀번호면(선택한 학교의 관리자 비밀번호와 일치) 학교/담당자 이름이 담긴 세션이 저장되고 대시보드로 이동한다', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('학교'), { target: { value: 'songlim-cho' } })
    fireEvent.change(screen.getByLabelText('담당자 이름'), { target: { value: '김선생' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '20262026' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => expect(screen.getByText('관리자 대시보드 페이지')).toBeInTheDocument())
    expect(saveAdminSession).toHaveBeenCalledWith({
      role: 'school-admin',
      schoolId: 'songlim-cho',
      schoolName: '송림초등학교',
      teacherName: '김선생',
    })
  })

  it('학교관리자: 틀린 비밀번호면 에러를 보여준다', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('학교'), { target: { value: 'songlim-cho' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('비밀번호가 올바르지 않아요'),
    )
    expect(saveAdminSession).not.toHaveBeenCalled()
  })

  it('학교관리자: 같은 비밀번호라도 다른 학교로 선택하면 실패한다(학교마다 다른 비밀번호)', async () => {
    fetchSchoolAdminPasswords.mockResolvedValue({
      'songlim-cho': '20262026',
      'jangang-cho': '1111',
    })
    renderPage()

    fireEvent.change(screen.getByLabelText('학교'), { target: { value: 'jangang-cho' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '20262026' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('비밀번호가 올바르지 않아요'),
    )
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
    expect(saveAdminSession).toHaveBeenCalledWith({ role: 'super-admin' })
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

  it('전체관리자: 비밀번호를 잊으셨나요 클릭 시 이메일이 없으면 안내만 하고 발송하지 않는다', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '전체관리자' }))
    fireEvent.click(screen.getByRole('button', { name: '비밀번호를 잊으셨나요?' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('이메일을 먼저 입력해 주세요'),
    )
    expect(sendSuperAdminPasswordReset).not.toHaveBeenCalled()
  })

  it('전체관리자: 이메일을 입력하고 비밀번호를 잊으셨나요를 누르면 재설정 이메일을 보낸다', async () => {
    sendSuperAdminPasswordReset.mockResolvedValue(true)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '전체관리자' }))
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'admin@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: '비밀번호를 잊으셨나요?' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('재설정 이메일을 보냈어요'))
    expect(sendSuperAdminPasswordReset).toHaveBeenCalledWith('admin@example.com')
  })

  it('전체관리자: 재설정 이메일 발송이 실패하면 에러를 보여준다', async () => {
    sendSuperAdminPasswordReset.mockResolvedValue(false)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '전체관리자' }))
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'admin@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: '비밀번호를 잊으셨나요?' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('재설정 이메일을 보내지 못했어요'),
    )
  })
})
