import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SeocheonMapBackground from './SeocheonMapBackground.jsx'

describe('SeocheonMapBackground', () => {
  it('장식용 svg를 렌더링한다 (스크린리더에서 숨김)', () => {
    const { container } = render(<SeocheonMapBackground />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})
