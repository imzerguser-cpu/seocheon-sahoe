import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import UnitBreadcrumb from './UnitBreadcrumb.jsx'

describe('UnitBreadcrumb', () => {
  it('경로 링크와 현재 위치를 렌더링한다', () => {
    render(
      <MemoryRouter>
        <UnitBreadcrumb
          trail={[
            { href: '/p/jihak', label: '지학사' },
            { href: '/p/jihak/u1', label: '1단원' },
          ]}
          current="1-1 소단원"
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('출판사 선택')).toHaveAttribute('href', '/')
    expect(screen.getByText('지학사')).toHaveAttribute('href', '/p/jihak')
    expect(screen.getByText('1단원')).toHaveAttribute('href', '/p/jihak/u1')
    expect(screen.getByText('1-1 소단원')).toBeInTheDocument()
  })
})
