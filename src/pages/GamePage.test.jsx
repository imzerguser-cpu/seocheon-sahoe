import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import GamePage from './GamePage.jsx'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import { saveSession } from '../lib/auth.js'

vi.mock('../firebase.js', () => ({ db: {}, app: {} }))
vi.mock('../lib/quizzesRepo.js', () => ({ fetchAllQuestions: vi.fn() }))
vi.mock('../lib/gameSettingsRepo.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, fetchGameSettings: vi.fn() }
})
// 전투 화면은 캔버스·애니메이션 루프를 쓰므로 여기서는 자리표시로 바꿔 둔다.
vi.mock('../components/game/BattleScreen.jsx', () => ({
  default: ({ questions, heroClass, missionTitle }) => (
    <div>
      전투 화면 {missionTitle} {heroClass} {questions.length}문항
    </div>
  ),
}))
vi.mock('../components/game/SpriteImage.jsx', () => ({ default: () => null }))

import { fetchAllQuestions } from '../lib/quizzesRepo.js'
import { fetchGameSettings } from '../lib/gameSettingsRepo.js'

const QUIZZES = [
  { id: 'q1', type: 'multiple-choice', question: 'A', choices: ['1', '2'], answerIndex: 0, scope: 'unit', refId: 'ecrimedia-u1' },
  { id: 'q2', type: 'ox', question: 'B', answer: 'O', scope: 'unit', refId: 'ecrimedia-u1' },
  { id: 'q3', type: 'short-answer', question: 'C', answer: '서천', scope: 'unit', refId: 'ecrimedia-u1' },
  { id: 'q4', type: 'ox', question: 'D', answer: 'O', scope: 'unit', refId: 'ecrimedia-u1', visible: false },
]

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  saveSession({ schoolId: 'jangang-cho', schoolName: '장항초', publisherId: 'ecrimedia', studentName: '홍길동' })
})

function renderPage() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/game/ecrimedia']}>
        <Routes>
          <Route path="/game/:publisherId" element={<GamePage />} />
          <Route path="/p/:publisherId" element={<div>단원 목록 페이지</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('GamePage', () => {
  it('관리자가 게임을 켜지 않은 학교 학생에게는 안내만 보여 준다', async () => {
    fetchGameSettings.mockResolvedValue({ 'other-cho': true })
    fetchAllQuestions.mockResolvedValue(QUIZZES)
    renderPage()
    expect(await screen.findByText('아직 선생님이 게임을 열지 않았어요.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /출전 준비/ })).not.toBeInTheDocument()
  })

  it('설정을 불러오지 못하면 오류를 안내한다', async () => {
    fetchGameSettings.mockRejectedValue(new Error('x'))
    fetchAllQuestions.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText(/게임을 불러오지 못했어요/)).toBeInTheDocument()
  })

  it('켜져 있으면 단원별 미션과 게임에 쓸 수 있는 문항 수를 보여 준다', async () => {
    fetchGameSettings.mockResolvedValue({ 'jangang-cho': true })
    fetchAllQuestions.mockResolvedValue(QUIZZES)
    renderPage()
    // 객관식 + OX만 세고, 단답형과 숨긴 퀴즈는 뺀다.
    expect(await screen.findByText('2문항 · 3개 전장')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1. 우리가 사는 곳 출전 준비' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '2. 일상에서 만나는 과거 출전 준비' })).toBeDisabled()
  })

  it('미션 → 수호자 선택 → 출발 순서로 전투에 들어간다', async () => {
    fetchGameSettings.mockResolvedValue({ 'jangang-cho': true })
    fetchAllQuestions.mockResolvedValue(QUIZZES)
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: '1. 우리가 사는 곳 출전 준비' }))
    expect(screen.getByText('성의 수호자를 선택하세요')).toBeInTheDocument()
    const archer = screen.getByRole('radio', { name: /궁수/ })
    fireEvent.click(archer)
    expect(archer).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('button', { name: '성 지키러 출발' }))
    expect(screen.getByText('전투 화면 1. 우리가 사는 곳 archer 2문항')).toBeInTheDocument()
  })

  it('단원 목록으로 돌아가는 링크가 있다', async () => {
    fetchGameSettings.mockResolvedValue({ 'jangang-cho': true })
    fetchAllQuestions.mockResolvedValue([])
    renderPage()
    expect(await screen.findByRole('link', { name: '← 단원 목록으로' })).toHaveAttribute('href', '/p/ecrimedia')
  })
})
