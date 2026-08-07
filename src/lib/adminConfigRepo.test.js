import { describe, it, expect, vi, beforeEach } from 'vitest'
import { doc, getDoc } from 'firebase/firestore'
import { fetchAdminConfig } from './adminConfigRepo.js'

vi.mock('../firebase.js', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...args) => args),
  getDoc: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchAdminConfig', () => {
  it('문서가 있으면 데이터를 반환한다', async () => {
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ password: '20262026' }) })
    const result = await fetchAdminConfig()
    expect(result).toEqual({ password: '20262026' })
    expect(doc).toHaveBeenCalledWith({}, 'adminConfig', 'main')
  })

  it('문서가 없으면 null을 반환한다', async () => {
    getDoc.mockResolvedValue({ exists: () => false })
    const result = await fetchAdminConfig()
    expect(result).toBeNull()
  })
})
