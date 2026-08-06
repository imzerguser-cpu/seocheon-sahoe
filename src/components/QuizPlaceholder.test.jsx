import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import QuizPlaceholder from './QuizPlaceholder.jsx'

describe('QuizPlaceholder', () => {
  it('scope에 맞는 안내 문구와 문항 수를 보여준다', () => {
    render(<QuizPlaceholder scope="unit" questionCount={0} />)
    expect(screen.getByText('이 대단원 퀴즈는 준비 중이에요.')).toBeInTheDocument()
    expect(screen.getByText('현재 등록된 문항 수: 0개')).toBeInTheDocument()
  })

  it('소단원 scope는 소단원으로 표시한다', () => {
    render(<QuizPlaceholder scope="subunit" questionCount={2} />)
    expect(screen.getByText('이 소단원 퀴즈는 준비 중이에요.')).toBeInTheDocument()
  })
})
