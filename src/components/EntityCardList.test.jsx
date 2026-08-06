import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import EntityCardList from './EntityCardList.jsx'

describe('EntityCardList', () => {
  it('항목이 있으면 링크 목록을 렌더링한다', () => {
    render(
      <MemoryRouter>
        <EntityCardList
          items={[
            { id: 'a', title: 'A단원' },
            { id: 'b', title: 'B단원' },
          ]}
          getHref={(item) => `/x/${item.id}`}
          emptyMessage="없음"
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('A단원')).toHaveAttribute('href', '/x/a')
    expect(screen.getByText('B단원')).toHaveAttribute('href', '/x/b')
  })

  it('항목이 없으면 안내 문구를 보여준다', () => {
    render(
      <MemoryRouter>
        <EntityCardList items={[]} getHref={() => '/'} emptyMessage="아직 없어요" />
      </MemoryRouter>,
    )
    expect(screen.getByText('아직 없어요')).toBeInTheDocument()
  })
})
