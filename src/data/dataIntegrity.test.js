import { describe, it, expect } from 'vitest'
import schools from './schools.json'
import publishers from './publishers.json'
import { curricula } from './curriculaIndex.js'

describe('학교 데이터의 publisherId는 실제 출판사 커리큘럼에 존재한다', () => {
  const publisherIds = new Set(publishers.map((p) => p.id))

  it.each(schools)('$name ($publisherId)', (school) => {
    expect(publisherIds.has(school.publisherId)).toBe(true)
    expect(curricula[school.publisherId]).toBeDefined()
  })
})

describe('모든 출판사 커리큘럼의 학습주제별 차시순서/전체차시가 정합성을 지킨다', () => {
  Object.entries(curricula).forEach(([publisherId, curriculum]) => {
    describe(publisherId, () => {
      curriculum.units.forEach((unit) => {
        unit.topics.forEach((topic) => {
          it(`${unit.id}/${topic.id}의 차시순서는 1..n이고 전체차시는 n이다`, () => {
            const lessons = topic.lessons
            const n = lessons.length
            const orders = lessons.map((l) => l.차시순서).slice().sort((a, b) => a - b)
            expect(orders).toEqual(Array.from({ length: n }, (_, i) => i + 1))
            lessons.forEach((lesson) => {
              expect(lesson.전체차시).toBe(n)
            })
          })
        })
      })
    })
  })
})
