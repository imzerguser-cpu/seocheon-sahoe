import { describe, it, expect } from 'vitest'
import { normalizeChoice } from './quizChoices.js'

describe('normalizeChoice', () => {
  it('예전 형식(문자열)이면 text로 감싸고 imageUrl은 빈 문자열로 채운다', () => {
    expect(normalizeChoice('보기1')).toEqual({ text: '보기1', imageUrl: '' })
  })

  it('이미 {text, imageUrl} 객체면 그대로(누락 필드만 보완해서) 반환한다', () => {
    expect(normalizeChoice({ text: '보기1', imageUrl: 'https://example.com/a.jpg' })).toEqual({
      text: '보기1',
      imageUrl: 'https://example.com/a.jpg',
    })
    expect(normalizeChoice({ text: '보기1' })).toEqual({ text: '보기1', imageUrl: '' })
  })
})
