import { describe, it, expect, beforeEach } from 'vitest'
import { defaultPublisherId } from './adminPublisher.js'
import { saveAdminSession, clearAdminSession } from './auth.js'
import { getPublishers } from './dataLoader.js'

const publishers = getPublishers()

beforeEach(() => {
  localStorage.clear()
})

describe('defaultPublisherId', () => {
  it('학교관리자로 로그인하면 소속 학교가 쓰는 출판사를 기본값으로 반환한다', () => {
    saveAdminSession({
      role: 'school-admin',
      schoolId: 'jangang-cho',
      schoolName: '장항초등학교',
      teacherName: '김선생',
    })
    // schools.json: jangang-cho → ecrimedia
    expect(defaultPublisherId(publishers, 'chunjae-park')).toBe('ecrimedia')
  })

  it('전체관리자로 로그인하면(소속 학교가 없으므로) fallback 출판사를 반환한다', () => {
    saveAdminSession({ role: 'super-admin' })
    expect(defaultPublisherId(publishers, 'chunjae-park')).toBe('chunjae-park')
  })

  it('로그인 세션이 없으면 fallback 출판사를 반환한다', () => {
    clearAdminSession()
    expect(defaultPublisherId(publishers, 'chunjae-park')).toBe('chunjae-park')
  })

  it('fallback 출판사 id가 존재하지 않으면 첫 번째 출판사를 반환한다', () => {
    saveAdminSession({ role: 'super-admin' })
    expect(defaultPublisherId(publishers, 'no-such-publisher')).toBe(publishers[0].id)
  })
})
