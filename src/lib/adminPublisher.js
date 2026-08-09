import schools from '../data/schools.json'
import { getAdminSession } from './auth.js'

// 학교관리자로 로그인하면 자기 학교가 쓰는 교과서 출판사를 기본값으로 보여준다.
// 전체관리자는 소속 학교가 없으므로 fallbackId(없으면 첫 출판사)를 그대로 쓴다.
export function defaultPublisherId(publishers, fallbackId) {
  const session = getAdminSession()
  if (session?.role === 'school-admin' && session.schoolId) {
    const school = schools.find((s) => s.id === session.schoolId)
    if (school?.publisherId) return school.publisherId
  }
  return publishers.find((p) => p.id === fallbackId)?.id ?? publishers[0]?.id ?? ''
}
