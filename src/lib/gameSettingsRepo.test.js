import { describe, it, expect, vi, beforeEach } from 'vitest'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { fetchGameSettings, setGameEnabled, isGameEnabled } from './gameSettingsRepo.js'

vi.mock('../firebase.js', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...args) => args),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchGameSettings', () => {
  it('문서가 있으면 학교별 설정을 그대로 반환한다', async () => {
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ 'a-cho': true }) })
    expect(await fetchGameSettings()).toEqual({ 'a-cho': true })
    expect(doc).toHaveBeenCalledWith({}, 'gameSettings', 'main')
  })

  it('문서가 없으면 빈 설정(모든 학교 꺼짐)을 반환하고 아무것도 쓰지 않는다', async () => {
    getDoc.mockResolvedValue({ exists: () => false })
    expect(await fetchGameSettings()).toEqual({})
    expect(setDoc).not.toHaveBeenCalled()
  })
})

describe('setGameEnabled', () => {
  it('해당 학교 값만 merge로 저장한다', async () => {
    setDoc.mockResolvedValue()
    await setGameEnabled('a-cho', true)
    expect(setDoc).toHaveBeenCalledWith([{}, 'gameSettings', 'main'], { 'a-cho': true }, { merge: true })
  })
})

describe('isGameEnabled', () => {
  it('값이 true일 때만 켜진 것으로 본다', () => {
    expect(isGameEnabled({ a: true }, 'a')).toBe(true)
    expect(isGameEnabled({ a: false }, 'a')).toBe(false)
    expect(isGameEnabled({}, 'a')).toBe(false)
    expect(isGameEnabled(null, 'a')).toBe(false)
  })
})
