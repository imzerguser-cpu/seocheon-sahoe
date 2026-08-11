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

  it('사진 자료도 새 창에서 열 수 있는 "자료 열기" 링크를 함께 보여준다', () => {
    render(
      <ResourceCard resource={{ type: 'photo', title: '갈대밭', url: 'https://example.com/a.jpg' }} />,
    )
    expect(screen.getByText('자료 열기')).toHaveAttribute('href', 'https://example.com/a.jpg')
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

  it('유튜브 watch 링크는 사이트 안에서 바로 재생되는 영상으로 임베드된다', () => {
    render(
      <ResourceCard
        resource={{
          type: 'video',
          title: '유튜브 영상',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        }}
      />,
    )
    const iframe = screen.getByTitle('유튜브 영상')
    expect(iframe.tagName).toBe('IFRAME')
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('유튜브 youtu.be 단축 링크도 임베드된다', () => {
    render(
      <ResourceCard
        resource={{ type: 'video', title: '짧은 링크', url: 'https://youtu.be/dQw4w9WgXcQ' }}
      />,
    )
    expect(screen.getByTitle('짧은 링크')).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    )
  })

  it('유튜브가 아닌 영상 링크는 임베드하지 않고 기존처럼 링크만 보여준다', () => {
    render(
      <ResourceCard
        resource={{ type: 'video', title: '다른 영상', url: 'https://example.com/clip.mp4' }}
      />,
    )
    expect(screen.queryByRole('iframe')).not.toBeInTheDocument()
    expect(screen.getByText('자료 열기')).toHaveAttribute('href', 'https://example.com/clip.mp4')
  })

  it('구글드라이브가 아닌 일반 파일(PDF/HWP) 링크는 미리보기 없이 "자료 열기" 링크만 보여준다', () => {
    render(
      <ResourceCard
        resource={{ type: 'file', title: '활동지.pdf', url: 'https://example.com/활동지.pdf' }}
      />,
    )
    expect(screen.getByText('활동지.pdf')).toBeInTheDocument()
    expect(screen.getByText('📄 파일(PDF/HWP)')).toBeInTheDocument()
    expect(screen.getByText('자료 열기')).toHaveAttribute(
      'href',
      'https://example.com/활동지.pdf',
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByTitle('활동지.pdf')).not.toBeInTheDocument()
  })

  it('구글드라이브로 공유한 파일(PDF/HWP)은 미리보기 iframe으로 바로 보여준다', () => {
    render(
      <ResourceCard
        resource={{
          type: 'file',
          title: '활동지.pdf',
          url: 'https://drive.google.com/file/d/abc123/view?usp=sharing',
        }}
      />,
    )
    const iframe = screen.getByTitle('활동지.pdf')
    expect(iframe.tagName).toBe('IFRAME')
    expect(iframe).toHaveAttribute('src', 'https://drive.google.com/file/d/abc123/preview')
    expect(screen.getByText('자료 열기')).toBeInTheDocument()
  })

  it('구글드라이브로 공유한 사진도 img 대신 미리보기 iframe으로 보여준다', () => {
    render(
      <ResourceCard
        resource={{
          type: 'photo',
          title: '갈대밭',
          url: 'https://drive.google.com/file/d/xyz789/view?usp=sharing',
        }}
      />,
    )
    const iframe = screen.getByTitle('갈대밭')
    expect(iframe.tagName).toBe('IFRAME')
    expect(iframe).toHaveAttribute('src', 'https://drive.google.com/file/d/xyz789/preview')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('구글드라이브 open?id= 형식 링크도 미리보기로 보여준다', () => {
    render(
      <ResourceCard
        resource={{ type: 'file', title: 'QR 안내', url: 'https://drive.google.com/open?id=qr001' }}
      />,
    )
    expect(screen.getByTitle('QR 안내')).toHaveAttribute(
      'src',
      'https://drive.google.com/file/d/qr001/preview',
    )
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
