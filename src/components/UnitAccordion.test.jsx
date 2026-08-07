import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import UnitAccordion from './UnitAccordion.jsx'

vi.mock('../lib/materialsRepo.js', () => ({
  fetchAllMaterials: vi.fn(),
}))
vi.mock('../lib/quizzesRepo.js', () => ({
  fetchAllQuestions: vi.fn(),
}))

import { fetchAllMaterials } from '../lib/materialsRepo.js'
import { fetchAllQuestions } from '../lib/quizzesRepo.js'

beforeEach(() => {
  vi.clearAllMocks()
  fetchAllMaterials.mockResolvedValue([])
  fetchAllQuestions.mockResolvedValue([])
})

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

  it('게시된 자료가 연결된 학습주제는 제목 옆에 자료 개수를 (N) 형식으로 보여준다', async () => {
    fetchAllMaterials.mockResolvedValue([
      {
        id: 'm1',
        status: 'published',
        lessonRefs: [{ publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t2-l1' }],
      },
    ])
    render(
      <MemoryRouter>
        <UnitAccordion publisherId="ecrimedia" units={[{ id: 'ecrimedia-u1', title: '1. 우리가 사는 곳', order: 1, semester: 1 }]} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('1. 우리가 사는 곳'))

    await waitFor(() => expect(screen.getByText('(1)')).toBeInTheDocument())
    const topicLink = screen.getByText('장소에 대해 알아볼까요').closest('a')
    expect(topicLink).toHaveTextContent('장소에 대해 알아볼까요 (1)')
  })

  it('검토 대기(status:pending) 자료는 학생 화면 개수에 포함되지 않는다', async () => {
    fetchAllMaterials.mockResolvedValue([
      {
        id: 'm1',
        status: 'pending',
        lessonRefs: [{ publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t2-l1' }],
      },
    ])
    render(
      <MemoryRouter>
        <UnitAccordion publisherId="ecrimedia" units={[{ id: 'ecrimedia-u1', title: '1. 우리가 사는 곳', order: 1, semester: 1 }]} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('1. 우리가 사는 곳'))

    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())
    expect(screen.queryByText(/\(1\)/)).not.toBeInTheDocument()
  })

  it('연결된 자료가 없는 학습주제에는 괄호 개수를 보여주지 않는다', async () => {
    render(
      <MemoryRouter>
        <UnitAccordion publisherId="ecrimedia" units={[{ id: 'ecrimedia-u1', title: '1. 우리가 사는 곳', order: 1, semester: 1 }]} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('1. 우리가 사는 곳'))

    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument()
  })

  it('자료 없이 퀴즈만 있어도(학습주제 범위) 그 개수가 (N)으로 보인다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'topic', refId: 'ecrimedia-u1-t2', question: 'Q' },
    ])
    render(
      <MemoryRouter>
        <UnitAccordion publisherId="ecrimedia" units={[{ id: 'ecrimedia-u1', title: '1. 우리가 사는 곳', order: 1, semester: 1 }]} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('1. 우리가 사는 곳'))

    await waitFor(() => expect(screen.getByText('(1)')).toBeInTheDocument())
  })

  it('자료 없이 퀴즈만 있어도(그 학습주제의 차시 범위) 그 개수가 (N)으로 보인다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', question: 'Q' },
    ])
    render(
      <MemoryRouter>
        <UnitAccordion publisherId="ecrimedia" units={[{ id: 'ecrimedia-u1', title: '1. 우리가 사는 곳', order: 1, semester: 1 }]} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('1. 우리가 사는 곳'))

    await waitFor(() => expect(screen.getByText('(1)')).toBeInTheDocument())
  })

  it('자료 1개와 퀴즈 1개가 함께 있으면 합산해서 (2)로 보인다', async () => {
    fetchAllMaterials.mockResolvedValue([
      {
        id: 'm1',
        status: 'published',
        lessonRefs: [{ publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t2-l1' }],
      },
    ])
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'topic', refId: 'ecrimedia-u1-t2', question: 'Q' },
    ])
    render(
      <MemoryRouter>
        <UnitAccordion publisherId="ecrimedia" units={[{ id: 'ecrimedia-u1', title: '1. 우리가 사는 곳', order: 1, semester: 1 }]} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('1. 우리가 사는 곳'))

    await waitFor(() => expect(screen.getByText('(2)')).toBeInTheDocument())
  })

  it('검토 대기(status:pending)나 숨김(visible:false) 퀴즈는 개수에 포함되지 않는다', async () => {
    fetchAllQuestions.mockResolvedValue([
      { id: 'q1', scope: 'topic', refId: 'ecrimedia-u1-t2', question: 'Q1', status: 'pending' },
      { id: 'q2', scope: 'topic', refId: 'ecrimedia-u1-t2', question: 'Q2', visible: false },
    ])
    render(
      <MemoryRouter>
        <UnitAccordion publisherId="ecrimedia" units={[{ id: 'ecrimedia-u1', title: '1. 우리가 사는 곳', order: 1, semester: 1 }]} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('1. 우리가 사는 곳'))

    await waitFor(() => expect(fetchAllQuestions).toHaveBeenCalled())
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument()
  })
})
