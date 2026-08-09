import { describe, it, expect } from 'vitest'
import { formatPageRange } from './pageRange.js'

describe('formatPageRange', () => {
  it('차시가 하나면 그 쪽수 범위를 그대로 보여준다', () => {
    expect(formatPageRange([{ 쪽수: '12~14' }])).toBe('12~14쪽')
  })

  it('여러 차시의 쪽수 중 가장 작은 시작쪽과 가장 큰 끝쪽을 합쳐서 보여준다', () => {
    expect(formatPageRange([{ 쪽수: '18~20' }, { 쪽수: '21~22' }])).toBe('18~22쪽')
  })

  it('시작쪽과 끝쪽이 같으면 범위 없이 한 쪽만 보여준다', () => {
    expect(formatPageRange([{ 쪽수: '6~6' }])).toBe('6쪽')
  })

  it('쪽수 정보가 비어있는 차시는 건너뛴다', () => {
    expect(formatPageRange([{ 쪽수: '' }, { 쪽수: '10~12' }])).toBe('10~12쪽')
  })

  it('차시가 없거나 모두 쪽수 정보가 없으면 빈 문자열을 반환한다', () => {
    expect(formatPageRange([])).toBe('')
    expect(formatPageRange([{ 쪽수: '' }])).toBe('')
  })
})
