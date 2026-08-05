import { describe, it, expect, beforeEach } from 'vitest'
import { saveSelectedPublisher, getSelectedPublisher } from './publisherPreference.js'

beforeEach(() => {
  localStorage.clear()
})

describe('publisherPreference', () => {
  it('저장한 적이 없으면 null을 반환한다', () => {
    expect(getSelectedPublisher()).toBeNull()
  })

  it('선택한 출판사를 저장하고 불러올 수 있다', () => {
    saveSelectedPublisher('jihak')
    expect(getSelectedPublisher()).toBe('jihak')
  })
})
