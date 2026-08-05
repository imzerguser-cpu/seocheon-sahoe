import { describe, it, expect, beforeEach } from 'vitest'
import { saveSession, getSession, clearSession, isUnlocked, matchPasscode } from './auth.js'

beforeEach(() => {
  localStorage.clear()
})

describe('session storage', () => {
  it('세션이 없으면 null을 반환한다', () => {
    expect(getSession()).toBeNull()
    expect(isUnlocked()).toBe(false)
  })

  it('세션을 저장하고 불러올 수 있다', () => {
    saveSession('teacher')
    expect(getSession().role).toBe('teacher')
    expect(isUnlocked()).toBe(true)
  })

  it('세션을 지울 수 있다', () => {
    saveSession('student')
    clearSession()
    expect(getSession()).toBeNull()
  })
})

describe('matchPasscode', () => {
  const config = { teacherPasscode: 't-pass', studentPasscode: 's-pass' }

  it('교사 비밀번호를 입력하면 teacher를 반환한다', () => {
    expect(matchPasscode(config, 't-pass')).toBe('teacher')
  })

  it('학생 비밀번호를 입력하면 student를 반환한다', () => {
    expect(matchPasscode(config, 's-pass')).toBe('student')
  })

  it('둘 다 아니면 null을 반환한다', () => {
    expect(matchPasscode(config, 'wrong')).toBeNull()
  })

  it('config가 없으면 null을 반환한다', () => {
    expect(matchPasscode(null, 't-pass')).toBeNull()
  })
})
