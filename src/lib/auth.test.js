import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
} from 'firebase/auth'
import {
  saveSession,
  getSession,
  clearSession,
  saveAdminSession,
  getAdminSession,
  clearAdminSession,
  matchSchool,
  signInSuperAdmin,
  signOutSuperAdmin,
  changeSuperAdminPassword,
  sendSuperAdminPasswordReset,
} from './auth.js'

vi.mock('../firebase.js', () => ({ app: {} }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  reauthenticateWithCredential: vi.fn(),
  updatePassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  EmailAuthProvider: { credential: vi.fn() },
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

  it('학교관리자 세션을 저장하고 확인할 수 있다 (학교/담당자 정보 포함)', () => {
    saveAdminSession({
      role: 'school-admin',
      schoolId: 'a-cho',
      schoolName: 'A초',
      teacherName: '홍길동',
    })
    expect(getAdminSession()).toEqual({
      role: 'school-admin',
      schoolId: 'a-cho',
      schoolName: 'A초',
      teacherName: '홍길동',
    })
  })

  it('역할 문자열만 넘겨도 세션으로 저장된다', () => {
    saveAdminSession('super-admin')
    expect(getAdminSession()).toEqual({ role: 'super-admin' })
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
  const passwords = { 'a-cho': '0101', 'b-cho': '0202' }

  it('학교 id와 비밀번호(passwords 맵 기준)가 맞으면 해당 학교를 반환한다', () => {
    expect(matchSchool(schools, 'a-cho', '0101', passwords)).toEqual(schools[0])
  })

  it('비밀번호가 틀리면 null을 반환한다', () => {
    expect(matchSchool(schools, 'a-cho', 'wrong', passwords)).toBeNull()
  })

  it('존재하지 않는 학교면 null을 반환한다', () => {
    expect(matchSchool(schools, 'nope', '0101', passwords)).toBeNull()
  })

  it('비밀번호가 비어 있으면 null을 반환한다', () => {
    expect(matchSchool(schools, 'a-cho', '', passwords)).toBeNull()
  })

  it('passwords 맵이 바뀌면(운영 중 비밀번호 변경) 새 비밀번호로만 통과한다', () => {
    const updated = { 'a-cho': '9999', 'b-cho': '0202' }
    expect(matchSchool(schools, 'a-cho', '0101', updated)).toBeNull()
    expect(matchSchool(schools, 'a-cho', '9999', updated)).toEqual(schools[0])
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

describe('sendSuperAdminPasswordReset', () => {
  beforeEach(() => {
    getAuth.mockClear()
    sendPasswordResetEmail.mockReset()
  })

  it('재설정 이메일 발송에 성공하면 true를 반환한다', async () => {
    sendPasswordResetEmail.mockResolvedValue()
    const result = await sendSuperAdminPasswordReset('admin@example.com')
    expect(result).toBe(true)
    expect(sendPasswordResetEmail).toHaveBeenCalledWith({}, 'admin@example.com')
  })

  it('발송에 실패하면(예: 존재하지 않는 이메일) false를 반환한다', async () => {
    sendPasswordResetEmail.mockRejectedValue(new Error('auth/user-not-found'))
    const result = await sendSuperAdminPasswordReset('nobody@example.com')
    expect(result).toBe(false)
  })
})

describe('changeSuperAdminPassword', () => {
  beforeEach(() => {
    getAuth.mockClear()
    reauthenticateWithCredential.mockReset()
    updatePassword.mockReset()
    EmailAuthProvider.credential.mockReset()
  })

  it('현재 로그인한 전체관리자 계정으로 재인증한 뒤 새 비밀번호로 바꾼다', async () => {
    const user = { email: 'admin@example.com' }
    getAuth.mockReturnValueOnce({ currentUser: user })
    EmailAuthProvider.credential.mockReturnValue('credential')
    reauthenticateWithCredential.mockResolvedValue()
    updatePassword.mockResolvedValue()

    await changeSuperAdminPassword('oldpw', 'newpw')

    expect(EmailAuthProvider.credential).toHaveBeenCalledWith('admin@example.com', 'oldpw')
    expect(reauthenticateWithCredential).toHaveBeenCalledWith(user, 'credential')
    expect(updatePassword).toHaveBeenCalledWith(user, 'newpw')
  })

  it('재인증에 실패하면(현재 비밀번호가 틀리면) 에러가 전파되고 updatePassword는 호출되지 않는다', async () => {
    const user = { email: 'admin@example.com' }
    getAuth.mockReturnValueOnce({ currentUser: user })
    EmailAuthProvider.credential.mockReturnValue('credential')
    reauthenticateWithCredential.mockRejectedValue(new Error('auth/wrong-password'))

    await expect(changeSuperAdminPassword('oldpw', 'newpw')).rejects.toThrow()
    expect(updatePassword).not.toHaveBeenCalled()
  })

  it('로그인한 전체관리자 계정이 없으면 에러를 던진다', async () => {
    getAuth.mockReturnValueOnce({ currentUser: null })
    await expect(changeSuperAdminPassword('oldpw', 'newpw')).rejects.toThrow()
  })
})
