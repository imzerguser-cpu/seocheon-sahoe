import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import GameSettingsPage from './GameSettingsPage.jsx'
import { saveAdminSession } from '../lib/auth.js'
import schools from '../data/schools.json'

vi.mock('../firebase.js', () => ({ db: {}, app: {} }))
vi.mock('../lib/gameSettingsRepo.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, fetchGameSettings: vi.fn(), setGameEnabled: vi.fn() }
})

import { fetchGameSettings, setGameEnabled } from '../lib/gameSettingsRepo.js'

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

function renderPage() {
  return render(
    <MemoryRouter>
      <GameSettingsPage />
    </MemoryRouter>,
  )
}

describe('GameSettingsPage', () => {
  it('학교관리자는 자기 학교 스위치만 본다', async () => {
    saveAdminSession({ role: 'school-admin', schoolId: 'jangang-cho', schoolName: '장항초' })
    fetchGameSettings.mockResolvedValue({})
    renderPage()
    const switches = await screen.findAllByRole('switch')
    expect(switches).toHaveLength(1)
    expect(switches[0]).toHaveAccessibleName('장항초등학교 학생에게 게임 보이기')
    expect(switches[0]).toHaveAttribute('aria-checked', 'false')
  })

  it('전체관리자는 모든 학교 스위치를 본다', async () => {
    saveAdminSession('super-admin')
    fetchGameSettings.mockResolvedValue({ 'jangang-cho': true })
    renderPage()
    const switches = await screen.findAllByRole('switch')
    expect(switches).toHaveLength(schools.length)
    expect(screen.getByRole('switch', { name: '장항초등학교 학생에게 게임 보이기' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('스위치를 누르면 바로 저장하고 상태가 바뀐다', async () => {
    saveAdminSession({ role: 'school-admin', schoolId: 'jangang-cho', schoolName: '장항초' })
    fetchGameSettings.mockResolvedValue({})
    setGameEnabled.mockResolvedValue()
    renderPage()
    const sw = await screen.findByRole('switch')
    fireEvent.click(sw)
    await waitFor(() => expect(sw).toHaveAttribute('aria-checked', 'true'))
    expect(setGameEnabled).toHaveBeenCalledWith('jangang-cho', true)
    expect(sw).toHaveTextContent('켜짐')
  })

  it('저장에 실패하면 상태를 바꾸지 않고 오류를 알린다', async () => {
    saveAdminSession({ role: 'school-admin', schoolId: 'jangang-cho', schoolName: '장항초' })
    fetchGameSettings.mockResolvedValue({})
    setGameEnabled.mockRejectedValue(new Error('denied'))
    renderPage()
    const sw = await screen.findByRole('switch')
    fireEvent.click(sw)
    expect(await screen.findByRole('alert')).toHaveTextContent('저장하지 못했어요')
    expect(sw).toHaveAttribute('aria-checked', 'false')
  })

  it('설정을 불러오지 못하면 안내한다', async () => {
    saveAdminSession('super-admin')
    fetchGameSettings.mockRejectedValue(new Error('x'))
    renderPage()
    expect(await screen.findByText('설정을 불러오지 못했어요.')).toBeInTheDocument()
  })
})
