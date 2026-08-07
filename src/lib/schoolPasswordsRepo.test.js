import { describe, it, expect, vi, beforeEach } from 'vitest'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import {
  fetchSchoolPasswords,
  updateSchoolPassword,
  fetchSchoolAdminPasswords,
  updateSchoolAdminPassword,
} from './schoolPasswordsRepo.js'
import schools from '../data/schools.json'

vi.mock('../firebase.js', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...args) => args),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchSchoolPasswords', () => {
  it('문서가 있으면 그 데이터를 그대로 반환한다', async () => {
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ 'a-cho': '1234' }) })
    const result = await fetchSchoolPasswords()
    expect(result).toEqual({ 'a-cho': '1234' })
    expect(doc).toHaveBeenCalledWith({}, 'schoolPasswords', 'main')
    expect(setDoc).not.toHaveBeenCalled()
  })

  it('문서가 없으면 schools.json 기본값으로 시드하고 그 값을 반환한다', async () => {
    getDoc.mockResolvedValue({ exists: () => false })
    setDoc.mockResolvedValue()

    const result = await fetchSchoolPasswords()

    const expectedDefaults = Object.fromEntries(schools.map((s) => [s.id, s.password]))
    expect(result).toEqual(expectedDefaults)
    expect(setDoc).toHaveBeenCalledWith([{}, 'schoolPasswords', 'main'], expectedDefaults)
  })
})

describe('updateSchoolPassword', () => {
  it('해당 학교의 비밀번호만 merge로 갱신한다', async () => {
    setDoc.mockResolvedValue()
    await updateSchoolPassword('a-cho', '9999')
    expect(setDoc).toHaveBeenCalledWith(
      [{}, 'schoolPasswords', 'main'],
      { 'a-cho': '9999' },
      { merge: true },
    )
  })
})

describe('fetchSchoolAdminPasswords', () => {
  it('문서가 있으면 그 데이터를 그대로 반환한다', async () => {
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ 'a-cho': 'admin1234' }) })
    const result = await fetchSchoolAdminPasswords()
    expect(result).toEqual({ 'a-cho': 'admin1234' })
    expect(doc).toHaveBeenCalledWith({}, 'schoolAdminPasswords', 'main')
    expect(setDoc).not.toHaveBeenCalled()
  })

  it('문서가 없으면 기존 공용 학교관리자 비밀번호(adminConfig)로 전 학교를 시드한다', async () => {
    getDoc.mockImplementation((ref) => {
      const [, collection] = ref
      if (collection === 'schoolAdminPasswords') return Promise.resolve({ exists: () => false })
      if (collection === 'adminConfig') {
        return Promise.resolve({ exists: () => true, data: () => ({ password: '20262026' }) })
      }
      return Promise.resolve({ exists: () => false })
    })
    setDoc.mockResolvedValue()

    const result = await fetchSchoolAdminPasswords()

    const expectedDefaults = Object.fromEntries(schools.map((s) => [s.id, '20262026']))
    expect(result).toEqual(expectedDefaults)
    expect(setDoc).toHaveBeenCalledWith([{}, 'schoolAdminPasswords', 'main'], expectedDefaults)
  })

  it('기존 공용 비밀번호도 없으면 빈 문자열로 시드한다', async () => {
    getDoc.mockResolvedValue({ exists: () => false })
    setDoc.mockResolvedValue()

    const result = await fetchSchoolAdminPasswords()

    expect(result).toEqual(Object.fromEntries(schools.map((s) => [s.id, ''])))
  })
})

describe('updateSchoolAdminPassword', () => {
  it('해당 학교의 관리자 비밀번호만 merge로 갱신한다', async () => {
    setDoc.mockResolvedValue()
    await updateSchoolAdminPassword('a-cho', 'newAdminPw')
    expect(setDoc).toHaveBeenCalledWith(
      [{}, 'schoolAdminPasswords', 'main'],
      { 'a-cho': 'newAdminPw' },
      { merge: true },
    )
  })
})
