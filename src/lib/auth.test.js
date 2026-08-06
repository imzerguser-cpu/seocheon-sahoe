import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveSession,
  getSession,
  clearSession,
  saveAdminSession,
  getAdminSession,
  clearAdminSession,
  matchSchool,
  matchAdminPassword,
} from './auth.js'

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
  it('관리자 세션이 없으면 false를 반환한다', () => {
    expect(getAdminSession()).toBe(false)
  })

  it('관리자 세션을 저장하고 확인할 수 있다', () => {
    saveAdminSession()
    expect(getAdminSession()).toBe(true)
  })

  it('관리자 세션을 지울 수 있다', () => {
    saveAdminSession()
    clearAdminSession()
    expect(getAdminSession()).toBe(false)
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
