import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import QuizPlaceholder from './QuizPlaceholder.jsx'

describe('QuizPlaceholder', () => {
  it('scope="unit"이면 대단원으로 표시한다', () => {
    render(<QuizPlaceholder scope="unit" questionCount={0} />)
    expect(screen.getByText('이 대단원 퀴즈는 준비 중이에요.')).toBeInTheDocument()
    expect(screen.getByText('현재 등록된 문항 수: 0개')).toBeInTheDocument()
  })

  it('scope="topic"이면 학습주제로 표시한다', () => {
    render(<QuizPlaceholder scope="topic" questionCount={2} />)
    expect(screen.getByText('이 학습주제 퀴즈는 준비 중이에요.')).toBeInTheDocument()
    expect(screen.getByText('현재 등록된 문항 수: 2개')).toBeInTheDocument()
  })

  it('scope="lesson"이면 차시로 표시한다', () => {
    render(<QuizPlaceholder scope="lesson" questionCount={0} />)
    expect(screen.getByText('이 차시 퀴즈는 준비 중이에요.')).toBeInTheDocument()
  })
})
