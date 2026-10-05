import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import QuestionPanel from './QuestionPanel.jsx'

function fixedDeck(questions) {
  let i = 0
  return { size: questions.length, next: () => questions[i++ % questions.length] }
}

const Q1 = {
  id: 'q1',
  prompt: '서천의 갈대 축제가 열리는 곳은?',
  choices: [{ text: '장항 송림' }, { text: '신성리 갈대밭' }, { text: '한산' }, { text: '춘장대' }],
  answerIndex: 1,
}
const Q2 = { id: 'q2', prompt: '모시는 모시풀로 만든다.', choices: [{ text: 'O' }, { text: 'X' }], answerIndex: 0 }

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

function finishReading() {
  act(() => {
    vi.advanceTimersByTime(1000)
  })
}

describe('QuestionPanel', () => {
  it('잠깐 읽는 시간이 지난 뒤에야 답을 고를 수 있다', () => {
    render(<QuestionPanel deck={fixedDeck([Q1])} title="첫 번째 지식" onDone={() => {}} />)
    expect(screen.getByRole('button', { name: /신성리 갈대밭/ })).toBeDisabled()
    finishReading()
    expect(screen.getByRole('button', { name: /신성리 갈대밭/ })).toBeEnabled()
  })

  it('정답을 고르면 힘 선택하기로 넘어간다', () => {
    const onDone = vi.fn()
    render(<QuestionPanel deck={fixedDeck([Q1])} title="t" onDone={onDone} />)
    finishReading()
    fireEvent.click(screen.getByRole('button', { name: /신성리 갈대밭/ }))
    expect(screen.getByText('정답! 지식의 빛이 깨어났어요.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '힘 선택하기' }))
    expect(onDone).toHaveBeenCalledWith({ correct: true, wrongCount: 0 })
  })

  it('틀리면 정답을 알려 주고, 잠시 뒤 다음 문제로 다시 도전한다', () => {
    const onDone = vi.fn()
    render(<QuestionPanel deck={fixedDeck([Q1, Q2])} title="t" onDone={onDone} />)
    finishReading()
    fireEvent.click(screen.getByRole('button', { name: /장항 송림/ }))
    expect(screen.getByRole('status')).toHaveTextContent('정답은 ② 신성리 갈대밭이에요.')
    const next = screen.getByRole('button', { name: '정답을 확인해 주세요…' })
    expect(next).toBeDisabled()
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    fireEvent.click(screen.getByRole('button', { name: '다음 문제' }))
    expect(screen.getByText('모시는 모시풀로 만든다.')).toBeInTheDocument()
    finishReading()
    fireEvent.click(screen.getByRole('button', { name: 'O' }))
    fireEvent.click(screen.getByRole('button', { name: '힘 선택하기' }))
    expect(onDone).toHaveBeenCalledWith({ correct: true, wrongCount: 1 })
  })

  it('세 번 모두 틀리면 힘 없이 전투로 돌아간다', () => {
    const onDone = vi.fn()
    render(<QuestionPanel deck={fixedDeck([Q2])} title="t" onDone={onDone} />)
    for (let i = 0; i < 3; i++) {
      finishReading()
      fireEvent.click(screen.getByRole('button', { name: 'X' }))
      act(() => {
        vi.advanceTimersByTime(2000)
      })
      if (i < 2) fireEvent.click(screen.getByRole('button', { name: '다음 문제' }))
    }
    expect(screen.getByRole('status')).toHaveTextContent('정답은 O예요.')
    fireEvent.click(screen.getByRole('button', { name: '전투로 돌아가기' }))
    expect(onDone).toHaveBeenCalledWith({ correct: false, wrongCount: 3 })
  })

  it('숫자 키로도 답을 고를 수 있다', () => {
    render(<QuestionPanel deck={fixedDeck([Q1])} title="t" onDone={() => {}} />)
    finishReading()
    fireEvent.keyDown(window, { key: '2' })
    expect(screen.getByText('정답! 지식의 빛이 깨어났어요.')).toBeInTheDocument()
  })
})
