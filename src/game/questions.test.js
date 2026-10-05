import { describe, it, expect } from 'vitest'
import { toGameQuestion, toGameQuestions, createQuestionDeck } from './questions.js'

function seq(...values) {
  let i = 0
  return () => values[i++ % values.length]
}

describe('toGameQuestion', () => {
  it('객관식은 보기와 정답 번호를 그대로 옮긴다(옛 문자열 보기도 지원)', () => {
    const q = toGameQuestion({
      id: 'q1',
      type: 'multiple-choice',
      question: '서천의 갈대밭은?',
      choices: ['신성리', { text: '장항', imageUrl: 'x.png' }],
      answerIndex: 0,
    })
    expect(q).toEqual({
      id: 'q1',
      prompt: '서천의 갈대밭은?',
      choices: [
        { text: '신성리', imageUrl: '' },
        { text: '장항', imageUrl: 'x.png' },
      ],
      answerIndex: 0,
    })
  })

  it('OX는 O/X 두 보기로 바꾼다', () => {
    expect(toGameQuestion({ id: 'a', type: 'ox', question: 'q', answer: 'X' }).answerIndex).toBe(1)
    expect(toGameQuestion({ id: 'a', type: 'ox', question: 'q', answer: 'O' }).choices.map((c) => c.text)).toEqual(['O', 'X'])
  })

  it('단답형이나 잘못된 문제는 뺀다', () => {
    expect(toGameQuestion({ id: 'a', type: 'short-answer', question: 'q', answer: '서천' })).toBeNull()
    expect(toGameQuestion({ id: 'a', type: 'multiple-choice', question: 'q', choices: ['하나'], answerIndex: 0 })).toBeNull()
    expect(toGameQuestion({ id: 'a', type: 'multiple-choice', question: 'q', choices: ['a', 'b'], answerIndex: 5 })).toBeNull()
    expect(toGameQuestion({ id: 'a', type: 'ox', question: 'q', answer: '' })).toBeNull()
  })

  it('toGameQuestions는 쓸 수 있는 문제만 남긴다', () => {
    const list = toGameQuestions([
      { id: 'a', type: 'ox', question: 'q', answer: 'O' },
      { id: 'b', type: 'short-answer', question: 'q', answer: 'x' },
    ])
    expect(list.map((q) => q.id)).toEqual(['a'])
  })
})

describe('createQuestionDeck', () => {
  const questions = [
    { id: 'a', prompt: 'A', choices: [{ text: '1' }, { text: '2' }, { text: '3' }], answerIndex: 2 },
    { id: 'b', prompt: 'B', choices: [{ text: '1' }, { text: '2' }], answerIndex: 0 },
    { id: 'c', prompt: 'C', choices: [{ text: 'O' }, { text: 'X' }], answerIndex: 1 },
  ]

  it('한 바퀴 동안 모든 문제를 한 번씩 낸다', () => {
    const deck = createQuestionDeck(questions, seq(0.1, 0.7, 0.4, 0.9))
    const ids = [deck.next(), deck.next(), deck.next()].map((q) => q.id).sort()
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  it('보기를 섞어도 정답 보기는 그대로 정답이다', () => {
    const deck = createQuestionDeck([questions[0]], seq(0.9, 0.1, 0.5))
    for (let i = 0; i < 5; i++) {
      const q = deck.next()
      expect(q.choices[q.answerIndex].text).toBe('3')
    }
  })

  it('OX 보기 순서는 섞지 않는다', () => {
    const deck = createQuestionDeck([questions[2]], seq(0.9, 0.1))
    expect(deck.next().choices.map((c) => c.text)).toEqual(['O', 'X'])
  })

  it('다시 섞을 때 방금 낸 문제가 바로 이어서 나오지 않는다', () => {
    const deck = createQuestionDeck(questions.slice(0, 2), () => 0.99)
    let prev = deck.next().id
    for (let i = 0; i < 6; i++) {
      const cur = deck.next().id
      expect(cur).not.toBe(prev)
      prev = cur
    }
  })

  it('문제가 없으면 null을 돌려준다', () => {
    expect(createQuestionDeck([]).next()).toBeNull()
  })
})
