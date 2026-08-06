import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ResourceCard from './ResourceCard.jsx'

describe('ResourceCard', () => {
  it('링크가 있는 자료는 "자료 열기" 링크를 보여준다', () => {
    render(<ResourceCard resource={{ type: 'pdf', title: '학습지', url: 'https://example.com/a.pdf' }} />)
    expect(screen.getByText('학습지')).toBeInTheDocument()
    expect(screen.getByText('자료 열기')).toHaveAttribute('href', 'https://example.com/a.pdf')
  })

  it('링크가 없으면 준비 중 문구를 보여준다', () => {
    render(<ResourceCard resource={{ type: 'video', title: '영상 자료' }} />)
    expect(screen.getByText('링크 준비 중')).toBeInTheDocument()
  })
})
