import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AdminPasswordPage from './AdminPasswordPage.jsx'

vi.mock('../lib/adminConfigRepo.js', () => ({
  updateAdminPassword: vi.fn(),
}))

import { updateAdminPassword } from '../lib/adminConfigRepo.js'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AdminPasswordPage', () => {
  it('새 비밀번호 입력창과 저장 버튼을 보여준다', () => {
    render(<AdminPasswordPage />)
    expect(screen.getByLabelText('새 비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })

  it('입력값이 비어있으면 저장 버튼이 비활성화된다', () => {
    render(<AdminPasswordPage />)
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
  })

  it('제출하면 새 비밀번호로 updateAdminPassword를 호출하고 완료 메시지를 보여준다', async () => {
    updateAdminPassword.mockResolvedValue()
    render(<AdminPasswordPage />)

    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: '3333' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(updateAdminPassword).toHaveBeenCalledWith('3333')
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('학교관리자 비밀번호가 변경되었어요'),
    )
  })

  it('updateAdminPassword가 실패하면 에러 메시지를 보여주고 저장 버튼을 다시 활성화한다', async () => {
    updateAdminPassword.mockRejectedValue(new Error('network error'))
    render(<AdminPasswordPage />)

    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: '3333' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        '비밀번호 변경에 실패했어요. 다시 시도해 주세요.',
      ),
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).not.toBeDisabled()
  })
})
