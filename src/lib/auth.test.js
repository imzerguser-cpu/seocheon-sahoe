import { describe, it, expect, beforeEach, vi } from 'vitest'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  saveSession,
  getSession,
  clearSession,
  saveAdminSession,
  getAdminSession,
  clearAdminSession,
  matchSchool,
  matchAdminPassword,
  signInSuperAdmin,
  signOutSuperAdmin,
} from './auth.js'

vi.mock('../firebase.js', () => ({ app: {} }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
})

describe('school session storage', () => {
  it('세션이 없으면 null을 반환한다', () => {
    expect(getSession()).toBeNull()
  })

  it('세션을 저장하고 불러올 수 있다', () => {
    saveSession({ schoolId: 'a-cho', schoolName: 'A초', publisherId: 'jihak', studentName: '홍길동' })
    expect(getSession()).toEqual({
      schoolId: 'a-cho',
      schoolName: 'A초',
      publisherId: 'jihak',
      studentName: '홍길동',
    })
  })

  it('세션을 지울 수 있다', () => {
    saveSession({ schoolId: 'a-cho', schoolName: 'A초', publisherId: 'jihak', studentName: '' })
    clearSession()
    expect(getSession()).toBeNull()
  })

  it('schoolId가 없는 손상된 값은 null을 반환한다', () => {
    localStorage.setItem('seocheon-sahoe:session', JSON.stringify({ foo: 'bar' }))
    expect(getSession()).toBeNull()
  })

  it('JSON으로 파싱되지 않는 값은 null을 반환한다', () => {
    localStorage.setItem('seocheon-sahoe:session', 'not-json')
    expect(getSession()).toBeNull()
  })
})

describe('admin session storage', () => {
  it('세션이 없으면 null을 반환한다', () => {
    expect(getAdminSession()).toBeNull()
  })

  it('학교관리자 세션을 저장하고 확인할 수 있다', () => {
    saveAdminSession('school-admin')
    expect(getAdminSession()).toBe('school-admin')
  })

  it('전체관리자 세션을 저장하고 확인할 수 있다', () => {
    saveAdminSession('super-admin')
    expect(getAdminSession()).toBe('super-admin')
  })

  it('알 수 없는 값이 저장되어 있으면 null을 반환한다', () => {
    localStorage.setItem('seocheon-sahoe:admin-session', 'garbage')
    expect(getAdminSession()).toBeNull()
  })

  it('관리자 세션을 지울 수 있다', () => {
    saveAdminSession('school-admin')
    clearAdminSession()
    expect(getAdminSession()).toBeNull()
  })
})

describe('matchSchool', () => {
  const schools = [
    { id: 'a-cho', name: 'A초', publisherId: 'jihak', password: '0101' },
    { id: 'b-cho', name: 'B초', publisherId: 'donga', password: '0202' },
  ]

  it('학교 id와 비밀번호가 맞으면 해당 학교를 반환한다', () => {
    expect(matchSchool(schools, 'a-cho', '0101')).toEqual(schools[0])
  })

  it('비밀번호가 틀리면 null을 반환한다', () => {
    expect(matchSchool(schools, 'a-cho', 'wrong')).toBeNull()
  })

  it('존재하지 않는 학교면 null을 반환한다', () => {
    expect(matchSchool(schools, 'nope', '0101')).toBeNull()
  })

  it('비밀번호가 비어 있으면 null을 반환한다', () => {
    expect(matchSchool(schools, 'a-cho', '')).toBeNull()
  })
})

describe('matchAdminPassword', () => {
  const adminConfig = { password: '20262026' }

  it('비밀번호가 맞으면 true를 반환한다', () => {
    expect(matchAdminPassword(adminConfig, '20262026')).toBe(true)
  })

  it('비밀번호가 틀리면 false를 반환한다', () => {
    expect(matchAdminPassword(adminConfig, 'wrong')).toBe(false)
  })

  it('config가 없으면 false를 반환한다', () => {
    expect(matchAdminPassword(null, '20262026')).toBe(false)
  })
})

describe('signInSuperAdmin', () => {
  it('로그인에 성공하면 true를 반환한다', async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'abc' } })
    const result = await signInSuperAdmin('admin@example.com', 'pw123456')
    expect(result).toBe(true)
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'admin@example.com', 'pw123456')
  })

  it('로그인에 실패하면 false를 반환한다', async () => {
    signInWithEmailAndPassword.mockRejectedValue(new Error('auth/wrong-password'))
    const result = await signInSuperAdmin('admin@example.com', 'wrong')
    expect(result).toBe(false)
  })
})

describe('signOutSuperAdmin', () => {
  it('Firebase signOut을 호출한다', async () => {
    signOut.mockResolvedValue()
    await signOutSuperAdmin()
    expect(signOut).toHaveBeenCalledWith({})
  })
})
