import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import UnitAccordion from './UnitAccordion.jsx'

describe('UnitAccordion', () => {
  it('대단원 목록을 보여주고, 클릭 전에는 학습주제가 보이지 않는다', () => {
    render(
      <MemoryRouter>
        <UnitAccordion publisherId="ecrimedia" units={[{ id: 'ecrimedia-u1', title: '1. 우리가 사는 곳', order: 1, semester: 1 }]} />
      </MemoryRouter>,
    )
    expect(screen.getByText('1. 우리가 사는 곳')).toBeInTheDocument()
    expect(screen.queryByText('장소에 대해 알아볼까요')).not.toBeInTheDocument()
  })

  it('대단원을 클릭하면 학습주제 목록이 차시 수 뱃지와 함께 펼쳐지고, 첫 차시로 링크된다', () => {
    render(
      <MemoryRouter>
        <UnitAccordion publisherId="ecrimedia" units={[{ id: 'ecrimedia-u1', title: '1. 우리가 사는 곳', order: 1, semester: 1 }]} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('1. 우리가 사는 곳'))

    const topicLink = screen.getByText('장소에 대해 알아볼까요').closest('a')
    expect(topicLink).toHaveAttribute('href', '/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t2/ecrimedia-u1-t2-l1')

    const multiLessonTopicLink = screen.getByText('우리가 사는 곳에 있는 여러 장소를 표현해 볼까요').closest('a')
    expect(multiLessonTopicLink).toHaveTextContent('2차시')
  })

  it('다시 클릭하면 학습주제 목록이 접힌다', () => {
    render(
      <MemoryRouter>
        <UnitAccordion publisherId="ecrimedia" units={[{ id: 'ecrimedia-u1', title: '1. 우리가 사는 곳', order: 1, semester: 1 }]} />
      </MemoryRouter>,
    )
    const header = screen.getByText('1. 우리가 사는 곳')
    fireEvent.click(header)
    fireEvent.click(header)
    expect(screen.queryByText('장소에 대해 알아볼까요')).not.toBeInTheDocument()
  })

  it('대단원이 없으면 안내 문구를 보여준다', () => {
    render(
      <MemoryRouter>
        <UnitAccordion publisherId="ecrimedia" units={[]} />
      </MemoryRouter>,
    )
    expect(screen.getByText('아직 등록된 대단원이 없어요.')).toBeInTheDocument()
  })

  it('학기별로 대단원을 묶어서 1학기/2학기 소제목을 보여준다', () => {
    render(
      <MemoryRouter>
        <UnitAccordion
          publisherId="ecrimedia"
          units={[
            { id: 'ecrimedia-u1', title: '1. 우리가 사는 곳', order: 1, semester: 1 },
            { id: 'ecrimedia-u3', title: '3. 시대마다 다른 삶의 모습', order: 3, semester: 2 },
          ]}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('1학기')).toBeInTheDocument()
    expect(screen.getByText('2학기')).toBeInTheDocument()
  })
})
