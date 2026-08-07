import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ResourceCard from './ResourceCard.jsx'

describe('ResourceCard', () => {
  it('사진 자료는 이미지를 렌더링한다', () => {
    render(
      <ResourceCard resource={{ type: 'photo', title: '갈대밭', url: 'https://example.com/a.jpg' }} />,
    )
    expect(screen.getByRole('img', { name: '갈대밭' })).toHaveAttribute(
      'src',
      'https://example.com/a.jpg',
    )
  })

  it('QR 자료는 링크를 인코딩한 QR 코드를 렌더링한다', () => {
    render(<ResourceCard resource={{ type: 'qr', title: '안내', url: 'https://example.com/qr' }} />)
    expect(screen.getByLabelText('QR 코드')).toBeInTheDocument()
  })

  it('영상 자료는 QR·이미지 없이 "자료 열기" 링크만 보여준다', () => {
    render(
      <ResourceCard
        resource={{ type: 'video', title: '소개 영상', url: 'https://example.com/v' }}
      />,
    )
    expect(screen.getByText('소개 영상')).toBeInTheDocument()
    expect(screen.getByText('자료 열기')).toHaveAttribute('href', 'https://example.com/v')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('링크가 없으면 준비 중 문구를 보여준다', () => {
    render(<ResourceCard resource={{ type: 'video', title: '영상 자료' }} />)
    expect(screen.getByText('링크 준비 중')).toBeInTheDocument()
  })

  it('javascript: 스킴 URL은 이미지/링크로 렌더링하지 않고 준비 중 문구를 보여준다', () => {
    render(
      <ResourceCard
        resource={{ type: 'photo', title: '위험한 자료', url: 'javascript:alert(1)' }}
      />,
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText('자료 열기')).not.toBeInTheDocument()
    expect(screen.getByText('링크 준비 중')).toBeInTheDocument()
  })
})
