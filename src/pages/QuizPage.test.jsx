import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import QuizPage from './QuizPage.jsx'

function renderPage(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/quiz/:scope/:refId" element={<QuizPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('QuizPage', () => {
  it('scope=lesson, 문항이 없으면 준비 중 안내와 0개를 보여준다', () => {
    renderPage('/quiz/lesson/ecrimedia-u1-t5-l1')
    expect(screen.getByText('이 차시 퀴즈는 준비 중이에요.')).toBeInTheDocument()
    expect(screen.getByText('현재 등록된 문항 수: 0개')).toBeInTheDocument()
  })

  it('scope=topic도 준비 중 안내를 보여준다', () => {
    renderPage('/quiz/topic/ecrimedia-u1-t5')
    expect(screen.getByText('이 학습주제 퀴즈는 준비 중이에요.')).toBeInTheDocument()
  })

  it('알 수 없는 scope는 안내 문구를 보여주고 QuizPlaceholder를 렌더링하지 않는다', () => {
    renderPage('/quiz/garbage/x')
    expect(screen.getByText('알 수 없는 퀴즈 범위예요.')).toBeInTheDocument()
    expect(screen.queryByText(/퀴즈는 준비 중이에요/)).not.toBeInTheDocument()
  })

  it('뒤로 가기 버튼을 누르면 이전 화면으로 돌아간다', () => {
    render(
      <MemoryRouter initialEntries={['/prev', '/quiz/lesson/ecrimedia-u1-t5-l1']} initialIndex={1}>
        <Routes>
          <Route path="/prev" element={<div>이전 화면</div>} />
          <Route path="/quiz/:scope/:refId" element={<QuizPage />} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }))
    expect(screen.getByText('이전 화면')).toBeInTheDocument()
  })
})
