import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import SchoolPasswordsPage from './SchoolPasswordsPage.jsx'
import { saveAdminSession } from '../lib/auth.js'

function renderPage() {
  return render(
    <MemoryRouter>
      <SchoolPasswordsPage />
    </MemoryRouter>,
  )
}

vi.mock('../lib/schoolPasswordsRepo.js', () => ({
  fetchSchoolPasswords: vi.fn(),
  updateSchoolPassword: vi.fn(),
  fetchSchoolAdminPasswords: vi.fn(),
  updateSchoolAdminPassword: vi.fn(),
}))

import {
  fetchSchoolPasswords,
  updateSchoolPassword,
  fetchSchoolAdminPasswords,
  updateSchoolAdminPassword,
} from '../lib/schoolPasswordsRepo.js'

function studentLabel(schoolName) {
  return `${schoolName} 학생 로그인 비밀번호`
}
function adminLabel(schoolName) {
  return `${schoolName} 학교관리자 비밀번호`
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  fetchSchoolPasswords.mockResolvedValue({ 'songlim-cho': '0303', 'jangang-cho': '0101' })
  fetchSchoolAdminPasswords.mockResolvedValue({ 'songlim-cho': 'adminA', 'jangang-cho': 'adminB' })
})

describe('SchoolPasswordsPage (학교관리자로 로그인)', () => {
  beforeEach(() => {
    saveAdminSession({
      role: 'school-admin',
      schoolId: 'songlim-cho',
      schoolName: '송림초등학교',
      teacherName: '김선생',
    })
  })

  it('자기 학교의 학생/관리자 비밀번호만 보이고 다른 학교는 보이지 않는다', async () => {
    renderPage()
    await waitFor(() =>
      expect(screen.getByLabelText(studentLabel('송림초등학교'))).toHaveValue('0303'),
    )
    expect(screen.getByLabelText(adminLabel('송림초등학교'))).toHaveValue('adminA')
    expect(screen.queryByLabelText(studentLabel('장항초등학교'))).not.toBeInTheDocument()
  })

  it('두 비밀번호를 바꾸고 저장하면 두 repo 함수가 모두 자기 학교 id로 호출되고 완료 문구가 보인다', async () => {
    updateSchoolPassword.mockResolvedValue()
    updateSchoolAdminPassword.mockResolvedValue()
    renderPage()
    await waitFor(() =>
      expect(screen.getByLabelText(studentLabel('송림초등학교'))).toHaveValue('0303'),
    )

    fireEvent.change(screen.getByLabelText(studentLabel('송림초등학교')), {
      target: { value: '9999' },
    })
    fireEvent.change(screen.getByLabelText(adminLabel('송림초등학교')), {
      target: { value: 'newAdminPw' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(updateSchoolPassword).toHaveBeenCalledWith('songlim-cho', '9999'),
    )
    expect(updateSchoolAdminPassword).toHaveBeenCalledWith('songlim-cho', 'newAdminPw')
    expect(screen.getByRole('status')).toHaveTextContent('저장했어요')
  })
})

describe('SchoolPasswordsPage (전체관리자로 로그인)', () => {
  beforeEach(() => {
    saveAdminSession({ role: 'super-admin' })
  })

  it('모든 학교의 학생/관리자 비밀번호가 보인다', async () => {
    renderPage()
    await waitFor(() =>
      expect(screen.getByLabelText(studentLabel('송림초등학교'))).toHaveValue('0303'),
    )
    expect(screen.getByLabelText(studentLabel('장항초등학교'))).toHaveValue('0101')
    expect(screen.getByLabelText(adminLabel('장항초등학교'))).toHaveValue('adminB')
    expect(
      screen.getByText('서천초등학교', { selector: '.school-password-name' }),
    ).toBeInTheDocument()
  })

  it('한 학교의 비밀번호를 바꿔 저장해도 다른 학교 비밀번호는 그대로다', async () => {
    updateSchoolPassword.mockResolvedValue()
    updateSchoolAdminPassword.mockResolvedValue()
    renderPage()
    await waitFor(() =>
      expect(screen.getByLabelText(studentLabel('장항초등학교'))).toHaveValue('0101'),
    )

    fireEvent.change(screen.getByLabelText(studentLabel('장항초등학교')), {
      target: { value: '5555' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: '저장' })[0])

    await waitFor(() =>
      expect(updateSchoolPassword).toHaveBeenCalledWith('jangang-cho', '5555'),
    )
    expect(screen.getByLabelText(studentLabel('송림초등학교'))).toHaveValue('0303')
  })

  it('학생/관리자 비밀번호 저장이 둘 다 실패하면 에러 문구를 보여준다', async () => {
    updateSchoolPassword.mockRejectedValue(new Error('network error'))
    updateSchoolAdminPassword.mockRejectedValue(new Error('network error'))
    renderPage()
    await waitFor(() =>
      expect(screen.getByLabelText(studentLabel('송림초등학교'))).toHaveValue('0303'),
    )

    fireEvent.click(
      screen.getAllByRole('button', { name: '저장' }).find((btn) =>
        btn.closest('li').textContent.includes('송림초등학교'),
      ),
    )

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('저장에 실패했어요'))
  })

  it('둘 중 하나만 저장에 실패해도(예: 관리자 비밀번호 컬렉션 권한 문제) 완료 문구를 보여준다(부분 성공 허용)', async () => {
    updateSchoolPassword.mockResolvedValue()
    updateSchoolAdminPassword.mockRejectedValue(new Error('permission denied'))
    renderPage()
    await waitFor(() =>
      expect(screen.getByLabelText(studentLabel('송림초등학교'))).toHaveValue('0303'),
    )

    fireEvent.click(
      screen.getAllByRole('button', { name: '저장' }).find((btn) =>
        btn.closest('li').textContent.includes('송림초등학교'),
      ),
    )

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('저장했어요'))
  })

  it('학생/관리자 비밀번호 조회가 둘 다 실패해야 에러 문구를 보여준다', async () => {
    fetchSchoolPasswords.mockRejectedValue(new Error('network error'))
    fetchSchoolAdminPasswords.mockRejectedValue(new Error('network error'))
    renderPage()
    await waitFor(() =>
      expect(screen.getByText('비밀번호를 불러오지 못했어요.')).toBeInTheDocument(),
    )
  })

  it('관리자 비밀번호 조회만 실패해도(예: 컬렉션 권한 미설정) 학생 로그인 비밀번호는 정상적으로 보인다', async () => {
    fetchSchoolAdminPasswords.mockRejectedValue(new Error('permission denied'))
    renderPage()
    await waitFor(() =>
      expect(screen.getByLabelText(studentLabel('송림초등학교'))).toHaveValue('0303'),
    )
    expect(screen.queryByText('비밀번호를 불러오지 못했어요.')).not.toBeInTheDocument()
  })

  it('관리자 대시보드로 가는 뒤로가기 링크를 보여준다', () => {
    renderPage()
    expect(screen.getByRole('link', { name: '← 관리자 대시보드로' })).toHaveAttribute(
      'href',
      '/admin',
    )
  })
})
