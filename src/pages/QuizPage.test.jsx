import { render, screen } from '@testing-library/react'
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
  it('문항이 없으면 준비 중 안내를 보여준다', () => {
    renderPage('/quiz/lesson/jihak-u1-s1-l1')
    expect(screen.getByText('이 차시 퀴즈는 준비 중이에요.')).toBeInTheDocument()
  })
})
