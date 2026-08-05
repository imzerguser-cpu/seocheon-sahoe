import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PublisherSelectPage from './PublisherSelectPage.jsx'
import { getSelectedPublisher } from '../lib/publisherPreference.js'

beforeEach(() => {
  localStorage.clear()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<PublisherSelectPage />} />
        <Route path="/p/:publisherId" element={<div>대단원 목록 페이지</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PublisherSelectPage', () => {
  it('출판사 카드를 보여준다', () => {
    renderPage()
    expect(screen.getByText('지학사')).toBeInTheDocument()
    expect(screen.getByText('천재교과서')).toBeInTheDocument()
  })

  it('출판사를 선택하면 대단원 목록으로 이동하고 선택을 저장한다', () => {
    renderPage()
    fireEvent.click(screen.getByText('지학사'))
    expect(screen.getByText('대단원 목록 페이지')).toBeInTheDocument()
    expect(getSelectedPublisher()).toBe('jihak')
  })

  it('이전에 선택한 출판사가 있으면 이어서 보기 버튼을 보여준다', () => {
    localStorage.setItem('seocheon-sahoe:selected-publisher', 'chunjae')
    renderPage()
    expect(screen.getByText('이어서 보기: 천재교과서')).toBeInTheDocument()
  })
})
