import { describe, it, expect } from 'vitest'
import { fullSchoolName } from './schoolNames.js'

describe('fullSchoolName', () => {
  it('학교 이름 뒤에 "등학교"를 붙여 전체 명칭을 만든다', () => {
    expect(fullSchoolName({ name: '장항초' })).toBe('장항초등학교')
    expect(fullSchoolName({ name: '장항중앙초' })).toBe('장항중앙초등학교')
  })
})
