# 실제 교육과정 데이터 & 학교 기반 로그인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1단계 스캐폴드의 플레이스홀더 데이터(지학사/천재교과서 2곳, 교사/학생 공용 비밀번호)를 실제 8개 출판사 교육과정 데이터와 16개 학교 기반 로그인으로 교체한다.

**Architecture:** 데이터 모델을 `unit(대단원) > topic(학습주제) > lesson(차시)`로 바꾸고, 이미 검증된 실제 데이터(`docs/reference/curricula-data/*.json`)를 `src/data/`로 옮긴다. 로그인은 학교이름+학생이름+학교 비밀번호로 바뀌고 Firebase는 인증 경로에서 완전히 제거해 JSON 파일 비교 방식으로 통일한다. 대단원 목록은 아코디언으로 학습주제를 펼치고, 학습주제 클릭 시 그 학습주제의 첫 차시로 바로 이동한다.

**Tech Stack:** React 18, Vite 5, react-router-dom 6(HashRouter), Vitest + @testing-library/react. Firebase는 이번 단계에서 제거된다.

## Global Constraints

- 8개 출판사(천재교과서 박기범/김정인, 지학사, 동아, YBM, 아이스크림미디어, 비상교육, 미래엔) 실제 데이터를 모두 반영한다 — 플레이스홀더가 아니다. 데이터 출처는 이미 검증되어 저장소에 커밋된 `docs/reference/curricula-data/*.json`이다.
- 학습주제(topic) 안의 `차시순서`/`전체차시`는 **그 학습주제 내부의 상대값**이다(교과서 전체 단원 기준 값이 아니다).
- Firebase를 인증 경로에서 완전히 제거한다: `src/firebase.js`, `src/lib/accessConfig.js`, `.env.example` 삭제, `package.json`에서 `firebase` 의존성 제거, `.github/workflows/deploy.yml`에서 Firebase 시크릿 env 제거.
- 학교/관리자 비밀번호는 `src/data/schools.json`, `src/data/adminConfig.json`에 평문으로 저장하고 클라이언트에서 비교한다 (낮은 보안 수준은 의도된 설계 — 재논의 대상 아님).
- 교사/학생 구분은 없고 "학교" 단위로만 관리한다. 일반 사용자(학교 로그인)와 관리자 모두 로그아웃 버튼을 가진다.
- 출판사를 사용자가 직접 선택하는 화면은 없다 — 로그인 성공 시 학교에 매핑된 `publisherId`로 자동 이동한다.
- 퀴즈 scope는 `lesson`/`topic`/`unit` 세 가지이며(기존 `subunit`에서 `topic`으로 이름 변경), 세 링크 모두 차시 상세 페이지에 둔다.
- 참조 스펙: `docs/superpowers/specs/2026-08-06-real-curricula-and-school-login-design.md`

---

## Task 1: 실데이터 반영 + dataLoader.js 개편

**Files:**
- Create: `src/data/curricula/chunjae-park.json`, `chunjae-kim.json`, `donga.json`, `ybm.json`, `ecrimedia.json`, `visang.json`, `mirae.json`
- Modify: `src/data/curricula/jihak.json` (플레이스홀더 → 실제 데이터로 교체)
- Delete: `src/data/curricula/chunjae.json` (구 플레이스홀더, 박기범/김정인 2개 파일로 대체됨)
- Modify: `src/data/publishers.json`, `src/data/curriculaIndex.js`, `src/data/mappings.json`
- Create: `src/data/schools.json`, `src/data/adminConfig.json`
- Modify: `src/lib/dataLoader.js`
- Modify: `src/lib/dataLoader.test.js`

**Interfaces:**
- Produces: `curricula`(named export, `src/data/curriculaIndex.js`) — `{ [publisherId]: CurriculumObject }`, 8개 키
- Produces(모두 named export, `src/lib/dataLoader.js`):
  - `selectUnits(curriculum) -> Unit[]`
  - `selectUnit(curriculum, unitId) -> Unit|null`
  - `selectTopics(curriculum, unitId) -> Topic[]`
  - `selectTopic(curriculum, unitId, topicId) -> Topic|null`
  - `selectLessons(curriculum, unitId, topicId) -> Lesson[]` (정렬 기준: `차시순서`)
  - `selectLesson(curriculum, unitId, topicId, lessonId) -> Lesson|null`
  - `selectSeocheonTopicsForLesson(topicList, mappingList, publisherId, lessonId) -> SeocheonTopic[]`
  - `selectQuizQuestions(quizList, scope, refId) -> Question[]` (scope: `'lesson'|'topic'|'unit'`)
  - `getPublishers() -> Publisher[]`
  - `getUnits(publisherId) -> Unit[]`
  - `getUnit(publisherId, unitId) -> Unit|null`
  - `getTopics(publisherId, unitId) -> Topic[]`
  - `getTopic(publisherId, unitId, topicId) -> Topic|null`
  - `getLessons(publisherId, unitId, topicId) -> Lesson[]`
  - `getLesson(publisherId, unitId, topicId, lessonId) -> Lesson|null`
  - `getSeocheonTopicsForLesson(publisherId, lessonId) -> SeocheonTopic[]`
  - `getQuizQuestions(scope, refId) -> Question[]`
- `Lesson` shape: `{ id, 차시순서, 전체차시, 쪽수, 성취기준: string[] }` (title 없음 — 학습주제 제목을 그대로 사용)

- [ ] **Step 1: 실데이터 파일을 저장소로 복사**

```bash
cd "C:\Users\박정민\seocheon-sahoe"
cp docs/reference/curricula-data/jihak.json src/data/curricula/jihak.json
cp docs/reference/curricula-data/donga.json src/data/curricula/donga.json
cp docs/reference/curricula-data/ybm.json src/data/curricula/ybm.json
cp docs/reference/curricula-data/ecrimedia.json src/data/curricula/ecrimedia.json
cp docs/reference/curricula-data/visang.json src/data/curricula/visang.json
cp docs/reference/curricula-data/mirae.json src/data/curricula/mirae.json
cp docs/reference/curricula-data/chunjae-park.json src/data/curricula/chunjae-park.json
cp docs/reference/curricula-data/chunjae-kim.json src/data/curricula/chunjae-kim.json
cp docs/reference/curricula-data/schools.json src/data/schools.json
cp docs/reference/curricula-data/adminConfig.json src/data/adminConfig.json
cp docs/reference/curricula-data/publishers.json src/data/publishers.json
rm src/data/curricula/chunjae.json
```

- [ ] **Step 2: 복사된 JSON 파일이 모두 유효한지 확인**

Run: `node -e "['jihak','donga','ybm','ecrimedia','visang','mirae','chunjae-park','chunjae-kim'].forEach(id => { const d = require('./src/data/curricula/'+id+'.json'); console.log(id, d.units.length, 'units'); })"`
Expected: 8줄 출력, 각 `4 units` (오류 없이 파싱됨)

- [ ] **Step 3: src/data/curriculaIndex.js를 8개 출판사로 교체**

```js
import chunjaePark from './curricula/chunjae-park.json'
import chunjaeKim from './curricula/chunjae-kim.json'
import jihak from './curricula/jihak.json'
import donga from './curricula/donga.json'
import ybm from './curricula/ybm.json'
import ecrimedia from './curricula/ecrimedia.json'
import visang from './curricula/visang.json'
import mirae from './curricula/mirae.json'

export const curricula = {
  'chunjae-park': chunjaePark,
  'chunjae-kim': chunjaeKim,
  jihak,
  donga,
  ybm,
  ecrimedia,
  visang,
  mirae,
}
```

- [ ] **Step 4: src/data/mappings.json을 새 차시 ID 체계로 교체**

```json
[
  { "topicId": "topic_1-1-1", "publisherId": "ecrimedia", "lessonId": "ecrimedia-u1-t2-l1" },
  { "topicId": "topic_1-1-1", "publisherId": "chunjae-park", "lessonId": "chunjae-park-u1-t2-l1" },
  { "topicId": "topic_1-1-2", "publisherId": "ecrimedia", "lessonId": "ecrimedia-u1-t3-l1" },
  { "topicId": "topic_1-1-2", "publisherId": "chunjae-park", "lessonId": "chunjae-park-u1-t3-l1" },
  { "topicId": "topic_1-1-3", "publisherId": "ecrimedia", "lessonId": "ecrimedia-u1-t5-l1" },
  { "topicId": "topic_1-1-3", "publisherId": "ecrimedia", "lessonId": "ecrimedia-u1-t5-l2" },
  { "topicId": "topic_1-1-3", "publisherId": "chunjae-park", "lessonId": "chunjae-park-u1-t6-l1" },
  { "topicId": "topic_1-2-1", "publisherId": "ecrimedia", "lessonId": "ecrimedia-u1-t8-l1" },
  { "topicId": "topic_1-2-1", "publisherId": "chunjae-park", "lessonId": "chunjae-park-u1-t9-l1" },
  { "topicId": "topic_1-2-2", "publisherId": "ecrimedia", "lessonId": "ecrimedia-u1-t10-l1" },
  { "topicId": "topic_1-2-2", "publisherId": "chunjae-park", "lessonId": "chunjae-park-u1-t11-l1" },
  { "topicId": "topic_1-2-3", "publisherId": "ecrimedia", "lessonId": "ecrimedia-u1-t12-l1" },
  { "topicId": "topic_1-2-3", "publisherId": "chunjae-park", "lessonId": "chunjae-park-u1-t12-l1" }
]
```

`src/data/topics.json`(서천 지역화 자료 6건)은 그대로 둔다 — 이미 확인한 대로 이 매핑에서 참조하는 `topic_1-1-1`부터 `topic_1-2-3`까지 모두 존재한다.

- [ ] **Step 5: 실패하는 테스트로 src/lib/dataLoader.test.js 전체 교체**

```js
import { describe, it, expect } from 'vitest'
import {
  selectUnits,
  selectUnit,
  selectTopics,
  selectTopic,
  selectLessons,
  selectLesson,
  selectSeocheonTopicsForLesson,
  selectQuizQuestions,
  getPublishers,
  getUnits,
  getTopics,
  getLessons,
  getSeocheonTopicsForLesson,
} from './dataLoader.js'

const sampleCurriculum = {
  units: [
    {
      id: 'u2', title: '2단원', order: 2,
      topics: [{ id: 'u2-t1', title: '주제A', order: 1, lessons: [{ id: 'u2-t1-l1', 차시순서: 1, 전체차시: 1, 쪽수: '1~2', 성취기준: [] }] }],
    },
    {
      id: 'u1', title: '1단원', order: 1,
      topics: [
        {
          id: 'u1-t1', title: '주제B', order: 1,
          lessons: [
            { id: 'u1-t1-l2', 차시순서: 2, 전체차시: 2, 쪽수: '5~6', 성취기준: [] },
            { id: 'u1-t1-l1', 차시순서: 1, 전체차시: 2, 쪽수: '3~4', 성취기준: ['[4사01-01] 예시'] },
          ],
        },
      ],
    },
  ],
}

describe('selectUnits', () => {
  it('order 기준으로 정렬해서 반환한다', () => {
    expect(selectUnits(sampleCurriculum).map((u) => u.id)).toEqual(['u1', 'u2'])
  })

  it('curriculum이 없으면 빈 배열을 반환한다', () => {
    expect(selectUnits(null)).toEqual([])
  })
})

describe('selectUnit', () => {
  it('id로 단원을 찾는다', () => {
    expect(selectUnit(sampleCurriculum, 'u2').title).toBe('2단원')
  })

  it('없는 id는 null을 반환한다', () => {
    expect(selectUnit(sampleCurriculum, 'nope')).toBeNull()
  })
})

describe('selectTopics / selectTopic', () => {
  it('해당 단원의 학습주제를 반환한다', () => {
    expect(selectTopics(sampleCurriculum, 'u1')).toHaveLength(1)
  })

  it('단원이 없으면 빈 배열을 반환한다', () => {
    expect(selectTopics(sampleCurriculum, 'nope')).toEqual([])
  })

  it('학습주제를 id로 찾는다', () => {
    expect(selectTopic(sampleCurriculum, 'u1', 'u1-t1').title).toBe('주제B')
  })
})

describe('selectLessons / selectLesson', () => {
  it('차시순서 기준으로 정렬해서 반환한다', () => {
    expect(selectLessons(sampleCurriculum, 'u1', 'u1-t1').map((l) => l.id)).toEqual([
      'u1-t1-l1',
      'u1-t1-l2',
    ])
  })

  it('차시를 id로 찾는다', () => {
    const lesson = selectLesson(sampleCurriculum, 'u1', 'u1-t1', 'u1-t1-l1')
    expect(lesson.쪽수).toBe('3~4')
    expect(lesson.성취기준).toEqual(['[4사01-01] 예시'])
  })

  it('학습주제가 없으면 빈 배열을 반환한다', () => {
    expect(selectLessons(sampleCurriculum, 'u1', 'nope')).toEqual([])
  })
})

describe('selectSeocheonTopicsForLesson', () => {
  const topics = [
    { id: 't1', 차시제목: '토픽1' },
    { id: 't2', 차시제목: '토픽2' },
  ]
  const mappings = [
    { topicId: 't1', publisherId: 'pub-a', lessonId: 'l1' },
    { topicId: 't2', publisherId: 'pub-a', lessonId: 'l1' },
    { topicId: 't1', publisherId: 'pub-b', lessonId: 'l9' },
  ]

  it('출판사+차시로 매핑된 서천 자료를 모두 반환한다 (N:M)', () => {
    const result = selectSeocheonTopicsForLesson(topics, mappings, 'pub-a', 'l1')
    expect(result.map((t) => t.id)).toEqual(['t1', 't2'])
  })

  it('매핑이 없으면 빈 배열을 반환한다', () => {
    expect(selectSeocheonTopicsForLesson(topics, mappings, 'pub-a', 'l404')).toEqual([])
  })
})

describe('selectQuizQuestions', () => {
  const quizzes = [
    { id: 'q1', scope: 'lesson', refId: 'l1', parentTopicId: 't1', parentUnitId: 'u1', questions: [{ id: 'q1-a' }] },
    { id: 'q2', scope: 'lesson', refId: 'l2', parentTopicId: 't1', parentUnitId: 'u1', questions: [{ id: 'q2-a' }] },
    { id: 'q3', scope: 'lesson', refId: 'l3', parentTopicId: 't2', parentUnitId: 'u1', questions: [{ id: 'q3-a' }] },
  ]

  it('lesson scope는 해당 차시 문항만 반환한다', () => {
    expect(selectQuizQuestions(quizzes, 'lesson', 'l1')).toEqual([{ id: 'q1-a' }])
  })

  it('topic scope는 소속 차시 문항을 모두 모아 반환한다', () => {
    expect(selectQuizQuestions(quizzes, 'topic', 't1')).toEqual([{ id: 'q1-a' }, { id: 'q2-a' }])
  })

  it('unit scope는 대단원 전체 문항을 모아 반환한다', () => {
    expect(selectQuizQuestions(quizzes, 'unit', 'u1')).toEqual([
      { id: 'q1-a' },
      { id: 'q2-a' },
      { id: 'q3-a' },
    ])
  })

  it('일치하는 문항이 없으면 빈 배열을 반환한다', () => {
    expect(selectQuizQuestions(quizzes, 'lesson', 'l404')).toEqual([])
  })
})

describe('실제 데이터에 바인딩된 함수', () => {
  it('getPublishers는 8개 출판사를 포함한다', () => {
    const ids = getPublishers().map((p) => p.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'chunjae-park', 'chunjae-kim', 'jihak', 'donga', 'ybm', 'ecrimedia', 'visang', 'mirae',
      ]),
    )
    expect(ids).toHaveLength(8)
  })

  it('getUnits(ecrimedia)는 4개 대단원을 반환한다', () => {
    expect(getUnits('ecrimedia')).toHaveLength(4)
  })

  it('getTopics(ecrimedia, 1단원)에 실제 학습주제 제목이 들어있다', () => {
    const topics = getTopics('ecrimedia', 'ecrimedia-u1')
    expect(topics.map((t) => t.title)).toContain('장소에 대해 알아볼까요')
  })

  it('getLessons는 차시순서 기준으로 정렬된 차시를 반환한다', () => {
    const lessons = getLessons('ecrimedia', 'ecrimedia-u1', 'ecrimedia-u1-t5')
    expect(lessons.map((l) => l.차시순서)).toEqual([1, 2])
    expect(lessons.map((l) => l.전체차시)).toEqual([2, 2])
  })

  it('getSeocheonTopicsForLesson은 N:M 매핑을 실제 데이터에서 확인한다', () => {
    const topics = getSeocheonTopicsForLesson('ecrimedia', 'ecrimedia-u1-t5-l1')
    expect(topics.map((t) => t.id)).toEqual(['topic_1-1-3'])
  })
})
```

- [ ] **Step 6: 테스트 실행해 실패 확인**

Run: `npm test`
Expected: FAIL — `src/lib/dataLoader.js`가 아직 `selectTopics` 등을 export하지 않음

- [ ] **Step 7: src/lib/dataLoader.js 전체 교체**

```js
import publishersData from '../data/publishers.json'
import topicsData from '../data/topics.json'
import mappingsData from '../data/mappings.json'
import quizzesData from '../data/quizzes.json'
import { curricula } from '../data/curriculaIndex.js'

export function selectUnits(curriculum) {
  if (!curriculum) return []
  return [...curriculum.units].sort((a, b) => a.order - b.order)
}

export function selectUnit(curriculum, unitId) {
  return selectUnits(curriculum).find((u) => u.id === unitId) ?? null
}

export function selectTopics(curriculum, unitId) {
  const unit = selectUnit(curriculum, unitId)
  if (!unit) return []
  return [...unit.topics].sort((a, b) => a.order - b.order)
}

export function selectTopic(curriculum, unitId, topicId) {
  return selectTopics(curriculum, unitId).find((t) => t.id === topicId) ?? null
}

export function selectLessons(curriculum, unitId, topicId) {
  const topic = selectTopic(curriculum, unitId, topicId)
  if (!topic) return []
  return [...topic.lessons].sort((a, b) => a.차시순서 - b.차시순서)
}

export function selectLesson(curriculum, unitId, topicId, lessonId) {
  return selectLessons(curriculum, unitId, topicId).find((l) => l.id === lessonId) ?? null
}

export function selectSeocheonTopicsForLesson(topicList, mappingList, publisherId, lessonId) {
  const topicIds = mappingList
    .filter((m) => m.publisherId === publisherId && m.lessonId === lessonId)
    .map((m) => m.topicId)
  return topicList.filter((t) => topicIds.includes(t.id))
}

export function selectQuizQuestions(quizList, scope, refId) {
  if (scope === 'lesson') {
    const quiz = quizList.find((q) => q.scope === 'lesson' && q.refId === refId)
    return quiz ? quiz.questions : []
  }
  if (scope === 'topic') {
    return quizList
      .filter((q) => q.scope === 'lesson' && q.parentTopicId === refId)
      .flatMap((q) => q.questions)
  }
  if (scope === 'unit') {
    return quizList
      .filter((q) => q.scope === 'lesson' && q.parentUnitId === refId)
      .flatMap((q) => q.questions)
  }
  return []
}

export function getPublishers() {
  return publishersData
}

export function getUnits(publisherId) {
  return selectUnits(curricula[publisherId])
}

export function getUnit(publisherId, unitId) {
  return selectUnit(curricula[publisherId], unitId)
}

export function getTopics(publisherId, unitId) {
  return selectTopics(curricula[publisherId], unitId)
}

export function getTopic(publisherId, unitId, topicId) {
  return selectTopic(curricula[publisherId], unitId, topicId)
}

export function getLessons(publisherId, unitId, topicId) {
  return selectLessons(curricula[publisherId], unitId, topicId)
}

export function getLesson(publisherId, unitId, topicId, lessonId) {
  return selectLesson(curricula[publisherId], unitId, topicId, lessonId)
}

export function getSeocheonTopicsForLesson(publisherId, lessonId) {
  return selectSeocheonTopicsForLesson(topicsData, mappingsData, publisherId, lessonId)
}

export function getQuizQuestions(scope, refId) {
  return selectQuizQuestions(quizzesData, scope, refId)
}
```

- [ ] **Step 8: 테스트 재실행해 통과 확인**

Run: `npm test`
Expected: PASS (전체 테스트)

- [ ] **Step 9: 커밋**

```bash
git add src/data src/lib/dataLoader.js src/lib/dataLoader.test.js
git commit -m "feat: replace placeholder curricula with real 8-publisher data and topic-based model"
```

---

## Task 2: 인증 로직 개편 (학교/관리자 세션, Firebase 제거)

**Files:**
- Modify: `src/lib/auth.js`
- Modify: `src/lib/auth.test.js`
- Delete: `src/firebase.js`, `src/lib/accessConfig.js`, `.env.example`
- Modify: `package.json` (firebase 의존성 제거)

**Interfaces:**
- Produces (모두 named export, `src/lib/auth.js`):
  - `saveSession(session)` — `session: {schoolId, schoolName, publisherId, studentName}`
  - `getSession() -> {schoolId, schoolName, publisherId, studentName}|null` (schoolId 없는 손상된 값은 null 처리)
  - `clearSession()`
  - `saveAdminSession()`
  - `getAdminSession() -> boolean`
  - `clearAdminSession()`
  - `matchSchool(schools, schoolId, inputPassword) -> School|null`
  - `matchAdminPassword(adminConfig, inputPassword) -> boolean`

- [ ] **Step 1: 실패하는 테스트로 src/lib/auth.test.js 전체 교체**

```js
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
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npm test`
Expected: FAIL — `saveAdminSession` 등이 아직 export되지 않음

- [ ] **Step 3: src/lib/auth.js 전체 교체**

```js
const SESSION_KEY = 'seocheon-sahoe:session'
const ADMIN_SESSION_KEY = 'seocheon-sahoe:admin-session'

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.schoolId) return null
    return parsed
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function saveAdminSession() {
  localStorage.setItem(ADMIN_SESSION_KEY, 'true')
}

export function getAdminSession() {
  return localStorage.getItem(ADMIN_SESSION_KEY) === 'true'
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

export function matchSchool(schools, schoolId, inputPassword) {
  const school = schools.find((s) => s.id === schoolId)
  if (!school || !inputPassword) return null
  if (inputPassword !== school.password) return null
  return school
}

export function matchAdminPassword(adminConfig, inputPassword) {
  if (!adminConfig || !inputPassword) return false
  return inputPassword === adminConfig.password
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npm test`
Expected: PASS (전체 테스트)

- [ ] **Step 5: Firebase 관련 파일 삭제**

```bash
rm src/firebase.js src/lib/accessConfig.js .env.example
```

- [ ] **Step 6: package.json에서 firebase 의존성 제거**

`dependencies`에서 `"firebase": "^11.0.0",` 줄을 삭제한다. 최종 `dependencies`는 다음과 같아야 한다:

```json
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
```

- [ ] **Step 7: node_modules 정리 후 재설치, 빌드 확인**

Run: `npm install && npm run build`
Expected: `firebase` 패키지 없이 설치·빌드 성공 (이 시점에는 아직 `firebase.js`/`accessConfig.js`를 참조하는 파일들이 남아있어 `npm run build`는 실패할 수 있다 — Task 3, 4에서 그 참조들을 제거한 뒤 다시 확인한다. 지금은 `npm install`이 firebase 없이 성공하는지만 확인한다.)

Run: `npm install`
Expected: 성공, `node_modules/firebase` 디렉터리가 생성되지 않음

- [ ] **Step 8: 커밋**

```bash
git add src/lib/auth.js src/lib/auth.test.js package.json package-lock.json
git rm src/firebase.js src/lib/accessConfig.js .env.example
git commit -m "feat: replace Firebase auth with school/admin JSON-based session logic"
```

---

## Task 3: 로그인 페이지 개편 (학교/학생이름/비밀번호) + 출판사 선택 화면 제거

**Files:**
- Modify: `src/pages/LoginPage.jsx`
- Modify: `src/pages/LoginPage.test.jsx`
- Modify: `src/contexts/AuthContext.jsx`
- Delete: `src/pages/PublisherSelectPage.jsx`, `src/pages/PublisherSelectPage.test.jsx`
- Delete: `src/components/SeocheonMapBackground.jsx`, `src/components/SeocheonMapBackground.test.jsx`
- Delete: `src/components/PublisherSelector.jsx`
- Delete: `src/lib/publisherPreference.js`, `src/lib/publisherPreference.test.js`

**Interfaces:**
- Consumes: `saveSession`, `matchSchool`(`src/lib/auth.js`), `schools.json`(`src/data/schools.json`)
- Produces: `AuthProvider`, `useAuth() -> {session, login(session), logout()}` (named exports, `src/contexts/AuthContext.jsx`) — `login`은 이제 role 문자열이 아니라 전체 세션 객체를 받는다.

- [ ] **Step 1: src/contexts/AuthContext.jsx의 login 시그니처를 세션 객체 기반으로 교체**

```jsx
import { createContext, useContext, useState, useCallback } from 'react'
import { getSession, saveSession, clearSession } from '../lib/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession())

  const login = useCallback((schoolSession) => {
    saveSession(schoolSession)
    setSession(getSession())
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  return <AuthContext.Provider value={{ session, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: 실패하는 테스트로 src/pages/LoginPage.test.jsx 전체 교체**

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './LoginPage.jsx'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import { getSession } from '../lib/auth.js'
import schools from '../data/schools.json'

beforeEach(() => {
  localStorage.clear()
})

function renderLoginPage() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/p/:publisherId" element={<div>대단원 목록 페이지</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('LoginPage', () => {
  it('학교 선택 드롭다운에 모든 학교가 나열된다', () => {
    renderLoginPage()
    const select = screen.getByLabelText('학교')
    expect(select.options).toHaveLength(schools.length)
  })

  it('올바른 학교 비밀번호를 입력하면 세션이 저장되고 해당 출판사 대단원 목록으로 이동한다', () => {
    renderLoginPage()
    const firstSchool = schools[0]

    fireEvent.change(screen.getByLabelText('학교'), { target: { value: firstSchool.id } })
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: firstSchool.password } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    expect(screen.getByText('대단원 목록 페이지')).toBeInTheDocument()
    expect(getSession()).toEqual({
      schoolId: firstSchool.id,
      schoolName: firstSchool.name,
      publisherId: firstSchool.publisherId,
      studentName: '홍길동',
    })
  })

  it('틀린 비밀번호를 입력하면 에러 메시지를 보여주고 이동하지 않는다', () => {
    renderLoginPage()
    const firstSchool = schools[0]

    fireEvent.change(screen.getByLabelText('학교'), { target: { value: firstSchool.id } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '완전히틀림' } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    expect(screen.getByRole('alert')).toHaveTextContent('비밀번호가 올바르지 않아요')
    expect(getSession()).toBeNull()
  })
})
```

- [ ] **Step 3: 테스트 실행해 실패 확인**

Run: `npm test`
Expected: FAIL — `LoginPage`가 아직 학교 드롭다운을 렌더링하지 않음

- [ ] **Step 4: src/pages/LoginPage.jsx 전체 교체**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import schools from '../data/schools.json'
import { matchSchool } from '../lib/auth.js'

export default function LoginPage() {
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? '')
  const [studentName, setStudentName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const school = matchSchool(schools, schoolId, password)
    if (!school) {
      setError('비밀번호가 올바르지 않아요. 다시 확인해 주세요.')
      return
    }
    login({
      schoolId: school.id,
      schoolName: school.name,
      publisherId: school.publisherId,
      studentName,
    })
    navigate(`/p/${school.publisherId}`)
  }

  return (
    <main className="login-page">
      <h1>우리 고장 서천 지역화 자료</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="school">학교</label>
        <select id="school" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>

        <label htmlFor="studentName">이름</label>
        <input
          id="studentName"
          type="text"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="이름을 입력하세요"
        />

        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="학교 비밀번호를 입력하세요"
        />

        <button type="submit">입장하기</button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  )
}
```

- [ ] **Step 5: 테스트 재실행해 통과 확인**

Run: `npm test`
Expected: PASS (`LoginPage.test.jsx`는 통과하지만, 이 시점에는 `App.jsx`가 아직 삭제 예정 파일들을 import하고 있어 전체 스위트는 실패할 수 있다 — Task 8에서 App.jsx를 정리한 뒤 전체 스위트가 통과함을 확인한다. 지금은 `npx vitest run src/pages/LoginPage.test.jsx`로 이 파일만 확인한다.)

Run: `npx vitest run src/pages/LoginPage.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 6: 더 이상 쓰이지 않는 출판사 선택 관련 파일 삭제**

```bash
rm src/pages/PublisherSelectPage.jsx src/pages/PublisherSelectPage.test.jsx
rm src/components/SeocheonMapBackground.jsx src/components/SeocheonMapBackground.test.jsx
rm src/components/PublisherSelector.jsx
rm src/lib/publisherPreference.js src/lib/publisherPreference.test.js
```

이 파일들은 App.jsx가 아직 참조하고 있으므로 전체 빌드는 Task 8까지 깨진 상태로 남는다 — 정상이다.

- [ ] **Step 7: 커밋**

```bash
git add src/pages/LoginPage.jsx src/pages/LoginPage.test.jsx src/contexts/AuthContext.jsx
git rm src/pages/PublisherSelectPage.jsx src/pages/PublisherSelectPage.test.jsx src/components/SeocheonMapBackground.jsx src/components/SeocheonMapBackground.test.jsx src/components/PublisherSelector.jsx src/lib/publisherPreference.js src/lib/publisherPreference.test.js
git commit -m "feat: replace login with school/student/password form, remove publisher-select UI"
```

---

## Task 4: 관리자 로그인/대시보드 개편 (Firebase 제거)

**Files:**
- Modify: `src/components/AdminRoute.jsx`
- Modify: `src/pages/AdminLoginPage.jsx`
- Modify: `src/pages/AdminLoginPage.test.jsx`
- Modify: `src/pages/AdminDashboardPage.jsx`
- Modify: `src/pages/AdminDashboardPage.test.jsx`

**Interfaces:**
- Consumes: `matchAdminPassword`, `saveAdminSession`, `getAdminSession`, `clearAdminSession`(`src/lib/auth.js`), `adminConfig.json`(`src/data/adminConfig.json`)

- [ ] **Step 1: src/components/AdminRoute.jsx를 세션 기반으로 교체**

```jsx
import { Navigate, Outlet } from 'react-router-dom'
import { getAdminSession } from '../lib/auth.js'

export default function AdminRoute() {
  if (!getAdminSession()) return <Navigate to="/admin/login" replace />
  return <Outlet />
}
```

- [ ] **Step 2: 실패하는 테스트로 src/pages/AdminLoginPage.test.jsx 전체 교체**

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminLoginPage from './AdminLoginPage.jsx'
import { getAdminSession } from '../lib/auth.js'

beforeEach(() => {
  localStorage.clear()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/login']}>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<div>관리자 대시보드 페이지</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminLoginPage', () => {
  it('올바른 관리자 비밀번호를 입력하면 세션이 저장되고 대시보드로 이동한다', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '20262026' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(screen.getByText('관리자 대시보드 페이지')).toBeInTheDocument()
    expect(getAdminSession()).toBe(true)
  })

  it('틀린 비밀번호를 입력하면 에러 메시지를 보여준다', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(screen.getByRole('alert')).toHaveTextContent('비밀번호가 올바르지 않아요')
    expect(getAdminSession()).toBe(false)
  })
})
```

- [ ] **Step 3: 테스트 실행해 실패 확인**

Run: `npx vitest run src/pages/AdminLoginPage.test.jsx`
Expected: FAIL — `AdminLoginPage`가 아직 이메일 입력 필드를 가진 이전 폼임

- [ ] **Step 4: src/pages/AdminLoginPage.jsx 전체 교체**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import adminConfig from '../data/adminConfig.json'
import { matchAdminPassword, saveAdminSession } from '../lib/auth.js'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!matchAdminPassword(adminConfig, password)) {
      setError('비밀번호가 올바르지 않아요. 다시 확인해 주세요.')
      return
    }
    saveAdminSession()
    navigate('/admin')
  }

  return (
    <main className="admin-login-page">
      <h1>관리자 로그인</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="admin-password">비밀번호</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">로그인</button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  )
}
```

- [ ] **Step 5: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/pages/AdminLoginPage.test.jsx`
Expected: PASS (2 tests)

- [ ] **Step 6: 실패하는 테스트로 src/pages/AdminDashboardPage.test.jsx 전체 교체**

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminDashboardPage from './AdminDashboardPage.jsx'
import { saveAdminSession, getAdminSession } from '../lib/auth.js'

beforeEach(() => {
  localStorage.clear()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/login" element={<div>관리자 로그인 페이지</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminDashboardPage', () => {
  it('학교/관리자 비밀번호는 JSON 파일에서 직접 관리한다는 안내를 보여준다', () => {
    renderPage()
    expect(screen.getByText(/schools\.json/)).toBeInTheDocument()
    expect(screen.getByText(/adminConfig\.json/)).toBeInTheDocument()
  })

  it('로그아웃 버튼을 누르면 관리자 세션이 지워지고 관리자 로그인 페이지로 이동한다', () => {
    saveAdminSession()
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(screen.getByText('관리자 로그인 페이지')).toBeInTheDocument()
    expect(getAdminSession()).toBe(false)
  })
})
```

- [ ] **Step 7: 테스트 실행해 실패 확인**

Run: `npx vitest run src/pages/AdminDashboardPage.test.jsx`
Expected: FAIL — 현재 안내 문구가 Firebase 콘솔을 언급함, 로그아웃도 Firebase `signOut` 호출

- [ ] **Step 8: src/pages/AdminDashboardPage.jsx 전체 교체**

```jsx
import { useNavigate } from 'react-router-dom'
import { clearAdminSession } from '../lib/auth.js'

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  function handleSignOut() {
    clearAdminSession()
    navigate('/admin/login')
  }

  return (
    <main className="admin-dashboard-page">
      <h1>관리자 대시보드</h1>
      <p>
        학교별 비밀번호는 <code>src/data/schools.json</code>, 관리자 비밀번호는{' '}
        <code>src/data/adminConfig.json</code> 파일을 직접 수정해서 관리합니다. 교육과정과 서천
        지역화 자료도 저장소 코드로 직접 관리합니다.
      </p>
      <button type="button" onClick={handleSignOut}>
        로그아웃
      </button>
    </main>
  )
}
```

- [ ] **Step 9: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/pages/AdminDashboardPage.test.jsx`
Expected: PASS (2 tests)

- [ ] **Step 10: 커밋**

```bash
git add src/components/AdminRoute.jsx src/pages/AdminLoginPage.jsx src/pages/AdminLoginPage.test.jsx src/pages/AdminDashboardPage.jsx src/pages/AdminDashboardPage.test.jsx
git commit -m "feat: replace admin auth with JSON-based password check, remove Firebase"
```

---

## Task 5: 대단원 아코디언 + 대단원 목록 페이지 개편

**Files:**
- Create: `src/components/UnitAccordion.jsx`
- Create: `src/components/UnitAccordion.test.jsx`
- Modify: `src/pages/UnitListPage.jsx`
- Modify: `src/pages/UnitListPage.test.jsx`
- Delete: `src/pages/SubunitListPage.jsx`, `src/pages/SubunitListPage.test.jsx`
- Delete: `src/pages/LessonListPage.jsx`, `src/pages/LessonListPage.test.jsx`
- Delete: `src/components/EntityCardList.jsx`, `src/components/EntityCardList.test.jsx`
- Delete: `src/components/UnitBreadcrumb.jsx`, `src/components/UnitBreadcrumb.test.jsx`

**Interfaces:**
- Consumes: `getTopics`, `getLessons`(`src/lib/dataLoader.js`)
- Produces: `UnitAccordion`(default export, props: `publisherId`, `units`) — 대단원을 클릭하면 그 학습주제 목록이 펼쳐지고, 학습주제를 클릭하면 `/p/:publisherId/:unitId/:topicId/:lessonId`(그 학습주제의 첫 차시)로 이동하는 링크를 렌더링한다.

- [ ] **Step 1: 실패하는 테스트로 src/components/UnitAccordion.test.jsx 작성**

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import UnitAccordion from './UnitAccordion.jsx'

describe('UnitAccordion', () => {
  it('대단원 목록을 보여주고, 클릭 전에는 학습주제가 보이지 않는다', () => {
    render(
      <MemoryRouter>
        <UnitAccordion publisherId="ecrimedia" units={[{ id: 'ecrimedia-u1', title: '1. 우리가 사는 곳', order: 1 }]} />
      </MemoryRouter>,
    )
    expect(screen.getByText('1. 우리가 사는 곳')).toBeInTheDocument()
    expect(screen.queryByText('장소에 대해 알아볼까요')).not.toBeInTheDocument()
  })

  it('대단원을 클릭하면 학습주제 목록이 차시 수 뱃지와 함께 펼쳐지고, 첫 차시로 링크된다', () => {
    render(
      <MemoryRouter>
        <UnitAccordion publisherId="ecrimedia" units={[{ id: 'ecrimedia-u1', title: '1. 우리가 사는 곳', order: 1 }]} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('1. 우리가 사는 곳'))

    const topicLink = screen.getByText('장소에 대해 알아볼까요').closest('a')
    expect(topicLink).toHaveAttribute('href', '/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t2/ecrimedia-u1-t2-l1')

    const multiLessonTopicLink = screen.getByText('우리가 사는 곳에 있는 여러 장소를 표현해 볼까요').closest('a')
    expect(multiLessonTopicLink).toHaveTextContent('2차시')
  })

  it('다시 클릭하면 학습주제 목록이 접힌다', () => {
    render(
      <MemoryRouter>
        <UnitAccordion publisherId="ecrimedia" units={[{ id: 'ecrimedia-u1', title: '1. 우리가 사는 곳', order: 1 }]} />
      </MemoryRouter>,
    )
    const header = screen.getByText('1. 우리가 사는 곳')
    fireEvent.click(header)
    fireEvent.click(header)
    expect(screen.queryByText('장소에 대해 알아볼까요')).not.toBeInTheDocument()
  })

  it('대단원이 없으면 안내 문구를 보여준다', () => {
    render(
      <MemoryRouter>
        <UnitAccordion publisherId="ecrimedia" units={[]} />
      </MemoryRouter>,
    )
    expect(screen.getByText('아직 등록된 대단원이 없어요.')).toBeInTheDocument()
  })
})
```

이 테스트는 Task 1에서 복사한 `ecrimedia` 실데이터(1단원 학습주제 목록: `장소에 대해 알아볼까요`가 `ecrimedia-u1-t2`, `우리가 사는 곳에 있는 여러 장소를 표현해 볼까요`가 2차시로 구성된 `ecrimedia-u1-t5`)를 그대로 사용한다.

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npx vitest run src/components/UnitAccordion.test.jsx`
Expected: FAIL — `src/components/UnitAccordion.jsx` 없음

- [ ] **Step 3: src/components/UnitAccordion.jsx 구현**

```jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getTopics, getLessons } from '../lib/dataLoader.js'

export default function UnitAccordion({ publisherId, units }) {
  const [openUnitId, setOpenUnitId] = useState(null)

  if (units.length === 0) {
    return <p className="empty-state">아직 등록된 대단원이 없어요.</p>
  }

  return (
    <div className="unit-accordion">
      {units.map((unit) => {
        const isOpen = unit.id === openUnitId
        const topics = isOpen ? getTopics(publisherId, unit.id) : []

        return (
          <div key={unit.id} className="unit-accordion-item">
            <button
              type="button"
              className="unit-accordion-header"
              aria-expanded={isOpen}
              onClick={() => setOpenUnitId(isOpen ? null : unit.id)}
            >
              {unit.title}
            </button>
            {isOpen && (
              <ul className="topic-list">
                {topics.map((topic) => {
                  const lessons = getLessons(publisherId, unit.id, topic.id)
                  const firstLessonId = lessons[0]?.id
                  return (
                    <li key={topic.id}>
                      <Link
                        to={`/p/${publisherId}/${unit.id}/${topic.id}/${firstLessonId}`}
                        className="topic-link"
                      >
                        <span className="topic-title">{topic.title}</span>
                        <span className="topic-badge">{lessons.length}차시</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/components/UnitAccordion.test.jsx`
Expected: PASS (4 tests)

- [ ] **Step 5: 실패하는 테스트로 src/pages/UnitListPage.test.jsx 전체 교체**

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import UnitListPage from './UnitListPage.jsx'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import { saveSession } from '../lib/auth.js'

beforeEach(() => {
  localStorage.clear()
  saveSession({
    schoolId: 'jangang-cho',
    schoolName: '장항초',
    publisherId: 'ecrimedia',
    studentName: '홍길동',
  })
})

function renderWithRoute() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/p/ecrimedia']}>
        <Routes>
          <Route path="/p/:publisherId" element={<UnitListPage />} />
          <Route path="/login" element={<div>로그인 페이지</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('UnitListPage', () => {
  it('출판사 이름과 대단원 목록을 보여준다', () => {
    renderWithRoute()
    expect(screen.getByText('아이스크림미디어(한춘희)')).toBeInTheDocument()
    expect(screen.getByText('1. 우리가 사는 곳')).toBeInTheDocument()
  })

  it('로그인한 학교/학생 이름을 보여준다', () => {
    renderWithRoute()
    expect(screen.getByText('장항초 · 홍길동')).toBeInTheDocument()
  })

  it('로그아웃 버튼을 누르면 로그인 페이지로 이동한다', () => {
    renderWithRoute()
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: 테스트 실행해 실패 확인**

Run: `npx vitest run src/pages/UnitListPage.test.jsx`
Expected: FAIL — `UnitListPage`가 아직 학교/학생 이름이나 로그아웃 버튼을 렌더링하지 않음

- [ ] **Step 7: src/pages/UnitListPage.jsx 전체 교체**

```jsx
import { useParams, Navigate } from 'react-router-dom'
import { getUnits, getPublishers } from '../lib/dataLoader.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import UnitAccordion from '../components/UnitAccordion.jsx'

export default function UnitListPage() {
  const { publisherId } = useParams()
  const { session, logout } = useAuth()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  const publisher = getPublishers().find((p) => p.id === publisherId)
  const units = getUnits(publisherId)

  return (
    <main>
      <header className="unit-list-header">
        <div>
          <p className="school-label">
            {session.schoolName} · {session.studentName}
          </p>
          <h1>{publisher ? publisher.name : publisherId}</h1>
        </div>
        <button type="button" onClick={logout}>
          로그아웃
        </button>
      </header>
      <UnitAccordion publisherId={publisherId} units={units} />
    </main>
  )
}
```

`ProtectedRoute`가 이미 세션 없는 사용자를 `/login`으로 보내지만, `logout` 버튼을 누른 직후 같은 화면에서 즉시 `/login`으로 넘어가야 하므로 이 페이지 자체에서도 `session`이 없으면 리다이렉트한다.

- [ ] **Step 8: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/pages/UnitListPage.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 9: 더 이상 쓰이지 않는 파일 삭제**

```bash
rm src/pages/SubunitListPage.jsx src/pages/SubunitListPage.test.jsx
rm src/pages/LessonListPage.jsx src/pages/LessonListPage.test.jsx
rm src/components/EntityCardList.jsx src/components/EntityCardList.test.jsx
rm src/components/UnitBreadcrumb.jsx src/components/UnitBreadcrumb.test.jsx
```

이 파일들은 App.jsx와 LessonDetailPage.jsx가 아직 참조하고 있으므로 전체 빌드는 Task 6, 8까지 깨진 상태로 남는다 — 정상이다.

- [ ] **Step 10: 커밋**

```bash
git add src/components/UnitAccordion.jsx src/components/UnitAccordion.test.jsx src/pages/UnitListPage.jsx src/pages/UnitListPage.test.jsx
git rm src/pages/SubunitListPage.jsx src/pages/SubunitListPage.test.jsx src/pages/LessonListPage.jsx src/pages/LessonListPage.test.jsx src/components/EntityCardList.jsx src/components/EntityCardList.test.jsx src/components/UnitBreadcrumb.jsx src/components/UnitBreadcrumb.test.jsx
git commit -m "feat: replace unit/subunit/lesson pages with accordion-based unit list"
```

---

## Task 6: 차시 상세 페이지 전면 개편 (학습주제 큰 제목 + 이전/다음 차시 + 3단계 퀴즈 링크)

**Files:**
- Modify: `src/pages/LessonDetailPage.jsx`
- Modify: `src/pages/LessonDetailPage.test.jsx`

**Interfaces:**
- Consumes: `getUnit`, `getTopic`, `getLessons`, `getLesson`, `getSeocheonTopicsForLesson`(`src/lib/dataLoader.js`), `ResourceCard`(`src/components/ResourceCard.jsx`)

- [ ] **Step 1: 실패하는 테스트로 src/pages/LessonDetailPage.test.jsx 전체 교체**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LessonDetailPage from './LessonDetailPage.jsx'

function renderPage(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/p/:publisherId/:unitId/:topicId/:lessonId"
          element={<LessonDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LessonDetailPage', () => {
  it('대단원명, 학습주제 제목, 차시순서/전체차시, 쪽수, 성취기준을 보여준다', () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    expect(screen.getByText('1. 우리가 사는 곳')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '우리가 사는 곳에 있는 여러 장소를 표현해 볼까요' })).toBeInTheDocument()
    expect(screen.getByText('1 / 2차시 · 23~27쪽')).toBeInTheDocument()
    expect(
      screen.getByText('[4사01-01] 주변 여러 장소에서의 경험과 느낌을 다양한 방식으로 표현하고, 장소감을 나누며 서로 존중하는 태도를 지닌다.'),
    ).toBeInTheDocument()
  })

  it('첫 차시에서는 이전 차시 링크가 없고 다음 차시 링크만 있다', () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    expect(screen.queryByRole('link', { name: '◀ 이전 차시' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '다음 차시 ▶' })).toHaveAttribute(
      'href',
      '/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l2',
    )
  })

  it('마지막 차시에서는 다음 차시 링크가 없고 이전 차시 링크만 있다', () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l2')

    expect(screen.queryByRole('link', { name: '다음 차시 ▶' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '◀ 이전 차시' })).toHaveAttribute(
      'href',
      '/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1',
    )
  })

  it('매핑된 서천 지역화 자료가 있으면 제목과 자료 상태를 보여준다', () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    // topic_1-1-3이 이 차시에 매핑되어 있다
    expect(screen.getByText('주변 여러 장소에서의 경험과 느낌 표현하기')).toBeInTheDocument()
    expect(screen.getByText('자료 준비 중입니다.')).toBeInTheDocument()
  })

  it('차시/학습주제/대단원 3단계 퀴즈 링크를 모두 보여준다', () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    expect(screen.getByText('이 차시 퀴즈')).toHaveAttribute(
      'href',
      '/quiz/lesson/ecrimedia-u1-t5-l1',
    )
    expect(screen.getByText('이 학습주제 퀴즈')).toHaveAttribute(
      'href',
      '/quiz/topic/ecrimedia-u1-t5',
    )
    expect(screen.getByText('이 대단원 퀴즈')).toHaveAttribute('href', '/quiz/unit/ecrimedia-u1')
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npx vitest run src/pages/LessonDetailPage.test.jsx`
Expected: FAIL — 현재 페이지는 `subunitId` 파라미터를 쓰고 이전/다음 차시·3단계 퀴즈 링크가 없음

- [ ] **Step 3: src/pages/LessonDetailPage.jsx 전체 교체**

```jsx
import { useParams, Link, Navigate } from 'react-router-dom'
import {
  getUnit,
  getTopic,
  getLessons,
  getLesson,
  getSeocheonTopicsForLesson,
} from '../lib/dataLoader.js'
import ResourceCard from '../components/ResourceCard.jsx'

export default function LessonDetailPage() {
  const { publisherId, unitId, topicId, lessonId } = useParams()
  const unit = getUnit(publisherId, unitId)
  const topic = getTopic(publisherId, unitId, topicId)
  const lessons = getLessons(publisherId, unitId, topicId)
  const lesson = getLesson(publisherId, unitId, topicId, lessonId)
  const seocheonTopics = getSeocheonTopicsForLesson(publisherId, lessonId)

  if (!lesson) {
    return <Navigate to={`/p/${publisherId}`} replace />
  }

  const currentIndex = lessons.findIndex((l) => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  const lessonPath = (target) => `/p/${publisherId}/${unitId}/${topicId}/${target.id}`

  return (
    <main className="lesson-detail-page">
      <Link to={`/p/${publisherId}`} className="back-link">
        ← 대단원 목록으로
      </Link>
      <p className="unit-label">{unit ? unit.title : unitId}</p>
      <h1 className="topic-title">{topic ? topic.title : topicId}</h1>
      <p className="lesson-meta">
        {lesson.차시순서} / {lesson.전체차시}차시 · {lesson.쪽수}쪽
      </p>
      {lesson.성취기준.length > 0 && (
        <ul className="standards-list">
          {lesson.성취기준.map((standard) => (
            <li key={standard}>{standard}</li>
          ))}
        </ul>
      )}

      <nav className="lesson-nav">
        {prevLesson && (
          <Link to={lessonPath(prevLesson)}>◀ 이전 차시</Link>
        )}
        {nextLesson && (
          <Link to={lessonPath(nextLesson)}>다음 차시 ▶</Link>
        )}
      </nav>

      {seocheonTopics.length === 0 && (
        <p className="empty-state">아직 연결된 서천 지역화 자료가 없어요.</p>
      )}

      {seocheonTopics.map((seocheonTopic) => (
        <section key={seocheonTopic.id} className="topic-block">
          <h2>{seocheonTopic.차시제목}</h2>
          <p className="topic-usage">{seocheonTopic.활용법 || '활용 방법을 준비 중입니다.'}</p>
          {seocheonTopic.resources.length === 0 ? (
            <p className="empty-state">자료 준비 중입니다.</p>
          ) : (
            <div className="resource-list">
              {seocheonTopic.resources.map((resource, index) => (
                <ResourceCard key={`${seocheonTopic.id}-${index}`} resource={resource} />
              ))}
            </div>
          )}
        </section>
      ))}

      <div className="quiz-links">
        <Link to={`/quiz/lesson/${lessonId}`} className="quiz-link">
          이 차시 퀴즈
        </Link>
        <Link to={`/quiz/topic/${topicId}`} className="quiz-link">
          이 학습주제 퀴즈
        </Link>
        <Link to={`/quiz/unit/${unitId}`} className="quiz-link">
          이 대단원 퀴즈
        </Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/pages/LessonDetailPage.test.jsx`
Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/pages/LessonDetailPage.jsx src/pages/LessonDetailPage.test.jsx
git commit -m "feat: redesign lesson detail page with topic title, lesson nav, and 3-tier quiz links"
```

---

## Task 7: 퀴즈 scope 이름 변경(subunit→topic) + 버그 수정

**Files:**
- Modify: `src/components/QuizPlaceholder.jsx`
- Modify: `src/components/QuizPlaceholder.test.jsx`
- Modify: `src/pages/QuizPage.jsx`
- Modify: `src/pages/QuizPage.test.jsx`

**Interfaces:**
- Consumes: `getQuizQuestions(scope, refId)`(`src/lib/dataLoader.js`, scope: `'lesson'|'topic'|'unit'`)

- [ ] **Step 1: 실패하는 테스트로 src/components/QuizPlaceholder.test.jsx 전체 교체**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import QuizPlaceholder from './QuizPlaceholder.jsx'

describe('QuizPlaceholder', () => {
  it('scope="unit"이면 대단원으로 표시한다', () => {
    render(<QuizPlaceholder scope="unit" questionCount={0} />)
    expect(screen.getByText('이 대단원 퀴즈는 준비 중이에요.')).toBeInTheDocument()
    expect(screen.getByText('현재 등록된 문항 수: 0개')).toBeInTheDocument()
  })

  it('scope="topic"이면 학습주제로 표시한다', () => {
    render(<QuizPlaceholder scope="topic" questionCount={2} />)
    expect(screen.getByText('이 학습주제 퀴즈는 준비 중이에요.')).toBeInTheDocument()
    expect(screen.getByText('현재 등록된 문항 수: 2개')).toBeInTheDocument()
  })

  it('scope="lesson"이면 차시로 표시한다', () => {
    render(<QuizPlaceholder scope="lesson" questionCount={0} />)
    expect(screen.getByText('이 차시 퀴즈는 준비 중이에요.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npx vitest run src/components/QuizPlaceholder.test.jsx`
Expected: FAIL — `SCOPE_LABELS`에 `subunit`은 있지만 `topic`이 없음

- [ ] **Step 3: src/components/QuizPlaceholder.jsx의 SCOPE_LABELS 교체**

```jsx
const SCOPE_LABELS = {
  lesson: '차시',
  topic: '학습주제',
  unit: '대단원',
}

export default function QuizPlaceholder({ scope, questionCount }) {
  return (
    <div className="quiz-placeholder">
      <p>이 {SCOPE_LABELS[scope] ?? scope} 퀴즈는 준비 중이에요.</p>
      <p>현재 등록된 문항 수: {questionCount}개</p>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/components/QuizPlaceholder.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 5: 실패하는 테스트로 src/pages/QuizPage.test.jsx 전체 교체**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import QuizPage from './QuizPage.jsx'

function renderPage(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/quiz/:scope/:refId" element={<QuizPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('QuizPage', () => {
  it('scope=lesson, 문항이 없으면 준비 중 안내와 0개를 보여준다', () => {
    renderPage('/quiz/lesson/ecrimedia-u1-t5-l1')
    expect(screen.getByText('이 차시 퀴즈는 준비 중이에요.')).toBeInTheDocument()
    expect(screen.getByText('현재 등록된 문항 수: 0개')).toBeInTheDocument()
  })

  it('scope=topic도 준비 중 안내를 보여준다', () => {
    renderPage('/quiz/topic/ecrimedia-u1-t5')
    expect(screen.getByText('이 학습주제 퀴즈는 준비 중이에요.')).toBeInTheDocument()
  })

  it('알 수 없는 scope는 안내 문구를 보여주고 QuizPlaceholder를 렌더링하지 않는다', () => {
    renderPage('/quiz/garbage/x')
    expect(screen.getByText('알 수 없는 퀴즈 범위예요.')).toBeInTheDocument()
    expect(screen.queryByText(/퀴즈는 준비 중이에요/)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 6: 테스트 실행해 실패 확인**

Run: `npx vitest run src/pages/QuizPage.test.jsx`
Expected: FAIL — 현재 구현은 `questionCount`를 `0`으로 하드코딩하고 있고 scope 검증이 없음

- [ ] **Step 7: src/pages/QuizPage.jsx 전체 교체**

```jsx
import { useParams } from 'react-router-dom'
import { getQuizQuestions } from '../lib/dataLoader.js'
import QuizPlaceholder from '../components/QuizPlaceholder.jsx'

const VALID_SCOPES = ['lesson', 'topic', 'unit']

export default function QuizPage() {
  const { scope, refId } = useParams()
  const isValidScope = VALID_SCOPES.includes(scope)
  const questions = isValidScope ? getQuizQuestions(scope, refId) : []

  return (
    <main>
      <h1>퀴즈</h1>
      {!isValidScope && <p className="empty-state">알 수 없는 퀴즈 범위예요.</p>}
      {isValidScope && questions.length === 0 && (
        <QuizPlaceholder scope={scope} questionCount={questions.length} />
      )}
      {isValidScope && questions.length > 0 && (
        <ol>
          {questions.map((question) => (
            <li key={question.id}>{question.question}</li>
          ))}
        </ol>
      )}
    </main>
  )
}
```

- [ ] **Step 8: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/pages/QuizPage.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 9: 커밋**

```bash
git add src/components/QuizPlaceholder.jsx src/components/QuizPlaceholder.test.jsx src/pages/QuizPage.jsx src/pages/QuizPage.test.jsx
git commit -m "fix: rename quiz scope subunit to topic, fix hardcoded question count and scope validation"
```

---

## Task 8: App.jsx 라우트 재배선 (Firebase 없이)

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`

**Interfaces:**
- Consumes: `AuthProvider`(`src/contexts/AuthContext.jsx`), `ProtectedRoute`(`src/components/ProtectedRoute.jsx`), `AdminRoute`(`src/components/AdminRoute.jsx`), `LoginPage`, `AdminLoginPage`, `AdminDashboardPage`, `UnitListPage`, `LessonDetailPage`, `QuizPage`(각 `src/pages/*.jsx`)

이 시점에는 Task 1~7에서 새로 만든 파일들이 모두 갖춰져 있고, 삭제된 파일(PublisherSelectPage, SubunitListPage, LessonListPage 등)에 대한 참조만 App.jsx에 남아있다. 이 태스크에서 그 참조를 정리하면 프로젝트 전체가 다시 빌드된다.

- [ ] **Step 1: 실패하는 테스트로 src/App.test.jsx 전체 교체**

Firebase가 완전히 제거되었으므로 더 이상 `firebase/auth`나 `./firebase.js`를 모킹할 필요가 없다.

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'

describe('App', () => {
  it('루트 경로는 로그인 페이지로 리다이렉트된다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('우리 고장 서천 지역화 자료')).toBeInTheDocument()
  })

  it('알 수 없는 경로도 로그인 페이지로 리다이렉트된다', () => {
    render(
      <MemoryRouter initialEntries={['/totally-unknown-path']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('우리 고장 서천 지역화 자료')).toBeInTheDocument()
  })

  it('세션 없이 대단원 목록에 접근하면 로그인 페이지로 리다이렉트된다', () => {
    render(
      <MemoryRouter initialEntries={['/p/ecrimedia']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('우리 고장 서천 지역화 자료')).toBeInTheDocument()
  })

  it('관리자 경로는 관리자 세션이 없으면 관리자 로그인 페이지로 리다이렉트된다', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('관리자 로그인')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npm test`
Expected: FAIL — `App.jsx`가 아직 삭제된 `PublisherSelectPage.jsx`, `SubunitListPage.jsx`, `LessonListPage.jsx`를 import하고 있어 모듈을 찾지 못함

- [ ] **Step 3: src/App.jsx 전체 교체**

```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import AdminLoginPage from './pages/AdminLoginPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import UnitListPage from './pages/UnitListPage.jsx'
import LessonDetailPage from './pages/LessonDetailPage.jsx'
import QuizPage from './pages/QuizPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/p/:publisherId" element={<UnitListPage />} />
          <Route
            path="/p/:publisherId/:unitId/:topicId/:lessonId"
            element={<LessonDetailPage />}
          />
          <Route path="/quiz/:scope/:refId" element={<QuizPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npm test`
Expected: PASS (전체 테스트)

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 성공 — 더 이상 존재하지 않는 파일에 대한 import 에러가 없어야 한다

- [ ] **Step 6: 개발 서버로 수동 확인**

Run: `npm run dev`
Expected: `/` 접속 시 로그인 화면(학교 드롭다운·이름·비밀번호)이 보이고, 실제 학교(예: 장항초, 비밀번호 `0101`)로 로그인하면 아이스크림미디어 대단원 목록으로 이동하며, 대단원 클릭 → 학습주제 펼침 → 학습주제 클릭 → 차시 상세(학습주제 큰 제목, 이전/다음 차시 버튼) 흐름이 실제로 동작하는지 확인한다.

- [ ] **Step 7: 커밋**

```bash
git add src/App.jsx src/App.test.jsx
git commit -m "feat: rewire routes for topic-based navigation without Firebase"
```

---

## Task 9: CSS 정리 + README 재작성 + 배포 워크플로 Firebase 시크릿 제거

**Files:**
- Modify: `src/styles/theme.css`
- Modify: `README.md`
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- 없음 (스타일·문서·CI 설정)

- [ ] **Step 1: src/styles/theme.css 전체 교체**

삭제된 컴포넌트(출판사 선택 화면, 서천 지도 배경, EntityCardList, UnitBreadcrumb)용 규칙을 제거하고, 새 컴포넌트(로그인 폼, 대단원 아코디언, 차시 상세)용 규칙을 추가한다.

```css
:root {
  --color-bg: #fff7ec;
  --color-primary: #ff9d5c;
  --color-primary-dark: #e67e3d;
  --color-accent: #6fcf97;
  --color-text: #4a3b2a;
  --radius-md: 16px;
  --radius-lg: 24px;
  font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
}

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
}

main {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px 64px;
}

button {
  border-radius: var(--radius-md);
  border: none;
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  background: #d9c9b8;
  cursor: not-allowed;
}

.empty-state {
  color: #a08b73;
  font-style: italic;
}

/* 로그인 화면 */
.login-page,
.admin-login-page {
  max-width: 420px;
  margin: 48px auto;
  padding: 0 20px;
  text-align: center;
}

.login-page form,
.admin-login-page form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.login-page label,
.admin-login-page label {
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
}

.login-page select,
.login-page input,
.admin-login-page input {
  padding: 10px;
  border-radius: var(--radius-md);
  border: 1px solid #e6d5bf;
  font-size: 1rem;
}

/* 대단원 목록 헤더 */
.unit-list-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.school-label {
  color: var(--color-primary-dark);
  font-weight: 600;
  margin: 0 0 4px;
}

/* 대단원 아코디언 */
.unit-accordion {
  display: grid;
  gap: 12px;
}

.unit-accordion-item {
  background: white;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--color-accent);
}

.unit-accordion-header {
  width: 100%;
  text-align: left;
  background: white;
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 700;
  padding: 16px;
}

.topic-list {
  list-style: none;
  margin: 0;
  padding: 0 12px 12px;
  display: grid;
  gap: 8px;
}

.topic-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: 12px;
  text-decoration: none;
  color: var(--color-text);
}

.topic-badge {
  background: var(--color-primary);
  color: white;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

/* 차시 상세 페이지 */
.lesson-detail-page {
  text-align: center;
}

.back-link {
  display: inline-block;
  margin-bottom: 16px;
  color: var(--color-primary-dark);
  text-decoration: none;
}

.unit-label {
  color: var(--color-primary-dark);
  font-weight: 600;
  margin: 0;
}

.topic-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 8px 0 16px;
}

.lesson-meta {
  font-weight: 700;
  color: var(--color-accent);
}

.standards-list {
  list-style: none;
  padding: 0;
  color: #8a7358;
  font-size: 0.9rem;
}

.lesson-nav {
  display: flex;
  justify-content: space-between;
  margin: 24px 0;
}

.lesson-nav a {
  color: var(--color-primary-dark);
  font-weight: 700;
  text-decoration: none;
}

.topic-block {
  background: #fffaf3;
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 16px;
  text-align: left;
}

.resource-list {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.resource-card {
  background: white;
  border-radius: var(--radius-md);
  padding: 12px;
  border: 1px solid #f0e3d0;
}

.quiz-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.quiz-link {
  display: inline-block;
  background: var(--color-accent);
  color: white;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 700;
}
```

- [ ] **Step 2: README.md 전체 교체**

```markdown
# 서천 지역화 자료 사이트

## 개발 환경 실행

```bash
npm install
npm run dev
```

## 학교/관리자 비밀번호 관리

- 학교별 비밀번호: `src/data/schools.json`의 각 학교 항목에서 `password` 값을 직접 수정한다.
- 관리자 비밀번호: `src/data/adminConfig.json`의 `password` 값을 직접 수정한다.
- 파일을 수정한 뒤 커밋·배포하면 바로 반영된다. 사이트 내에는 비밀번호 변경 UI가 없다.

## 새 출판사 커리큘럼 추가하는 법

1. `src/data/curricula/<publisherId>.json`을 새로 만든다. 스키마는 다음과 같다:
   ```json
   {
     "publisherId": "예: newpub",
     "publisherName": "화면에 보일 출판사 이름",
     "note": "실제 교과서와 다를 수 있다는 안내 등",
     "units": [
       {
         "id": "newpub-u1", "title": "1. 우리가 사는 곳", "order": 1, "semester": 1,
         "topics": [
           {
             "id": "newpub-u1-t1", "title": "학습주제 제목", "order": 1,
             "lessons": [
               { "id": "newpub-u1-t1-l1", "차시순서": 1, "전체차시": 1, "쪽수": "8~11", "성취기준": [] }
             ]
           }
         ]
       }
     ]
   }
   ```
2. `src/data/curriculaIndex.js`에 새 파일을 import하고 `curricula` 객체에 `publisherId` 키로 추가한다.
3. `src/data/publishers.json`에 `{ "id": "newpub", "name": "화면에 보일 출판사 이름" }`을 추가한다.
4. 그 출판사를 쓰는 학교가 있다면 `src/data/schools.json`에 해당 학교의 `publisherId`를 이 값으로 설정한다.

## 서천 지역화 자료(자료 매핑) 추가하는 법

1. `src/data/topics.json`에 자료 항목을 추가한다(대단원/소단원/차시제목/활용법/resources).
2. `src/data/mappings.json`에 `{ "topicId": "...", "publisherId": "...", "lessonId": "..." }`를 추가해 원하는 출판사의 실제 차시 id와 연결한다. 차시 id는 `src/data/curricula/<publisherId>.json`에서 확인한다.

## 이미지 자료 추가 방법

이미지는 Firebase Storage가 아니라 저장소 내 `public/images/` 아래에 파일로 둔다.

1. `public/images/<차시나 자료 단위별 하위 폴더>/` 아래에 이미지 파일을 추가한다.
2. `src/data/topics.json`의 `resources` 배열에 사이트 루트 기준 경로로 등록한다:
   ```json
   { "type": "image", "title": "...", "src": "/images/<path>/<file>.jpg" }
   ```
3. 저장소 용량 관리를 위해 추가하기 전에 이미지를 웹용으로 압축·리사이즈한다 (예: 가로 최대 약 1600px).

## GitHub Pages 배포

1. GitHub에 새 저장소 생성 (예: `seocheon-sahoe`)
2. 저장소 Settings → Pages → Build and deployment → Source를 "GitHub Actions"로 설정
3. `vite.config.js`의 `base` 값이 저장소 이름과 일치하는지 확인 (`/저장소이름/`)
4. `master` 브랜치에 푸시하면 GitHub Actions가 자동으로 테스트 → 빌드 → 배포를 실행한다
5. 배포된 사이트 주소: `https://<github-사용자명>.github.io/seocheon-sahoe/`
```

- [ ] **Step 3: .github/workflows/deploy.yml에서 Firebase 시크릿 env 블록 제거**

`- run: npm run build` 스텝에서 `env:` 블록 전체(6개 `VITE_FIREBASE_*` 시크릿)를 삭제한다. 최종 `build` 스텝은 다음과 같아야 한다:

```yaml
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
```

파일의 나머지 부분(permissions, concurrency, deploy job)은 그대로 둔다.

- [ ] **Step 4: 커밋**

```bash
git add src/styles/theme.css README.md .github/workflows/deploy.yml
git commit -m "docs: rewrite README and CSS for real data and school login, drop Firebase from CI"
```

---

## Task 10: 최종 통합 확인

**Files:** 없음 (검증 전용 태스크 — 코드 변경 없음, 문제 발견 시에만 최소 수정)

**Interfaces:** 없음

- [ ] **Step 1: 전체 테스트 스위트 실행**

```bash
cd "C:\Users\박정민\seocheon-sahoe"
npm test
```

모든 테스트가 통과해야 한다. 실패가 있으면 원인을 조사해 수정하고(관련 태스크의 파일을 고친다) 재실행한다. `firebase` import나 mock 잔재가 남아있지 않은지 특히 확인한다(`grep -r firebase src/` 결과가 비어 있어야 한다).

- [ ] **Step 2: 프로덕션 빌드 확인**

```bash
npm run build
```

빌드가 에러 없이 끝나야 한다. `dist/` 산출물이 생성되는지 확인한다.

- [ ] **Step 3: 개발 서버로 수동 점검**

```bash
npm run dev
```

브라우저(또는 헤드리스 확인)로 다음 경로를 순서대로 확인한다:
1. `/` 또는 `/#/` 접속 시 `/login`으로 리다이렉트되는지
2. 학교 드롭다운에 16개 학교가 모두 나오는지, 잘못된 비밀번호 입력 시 에러 메시지가 나오는지
3. 올바른 학교+이름+비밀번호로 로그인하면 그 학교의 `publisherId`에 해당하는 `/p/:publisherId`로 자동 이동하는지, 헤더에 학교명·학생이름이 보이는지
4. 대단원 아코디언을 펼치면 학습주제 목록이 원래 교과서 순서대로 나오는지, 학습주제를 클릭하면 그 학습주제의 첫 차시 상세 페이지로 바로 이동하는지
5. 차시 상세 페이지에 학습주제(큰 글씨, 중앙), 대단원명, 해당차시/전체차시(그 학습주제 기준 상대값), 쪽수, 성취기준이 모두 보이는지, 다음/이전 차시 버튼이 정상 동작하는지(첫/마지막 차시에서는 해당 방향 버튼이 없거나 비활성인지)
6. 차시 상세 페이지에 `lesson`/`topic`/`unit` 세 스코프의 퀴즈 링크가 모두 있고 각각 정상적으로 QuizPage로 이동하는지
7. 일반 사용자 화면과 관리자 화면 모두에 로그아웃 버튼이 있고, 클릭 시 세션이 지워지고 로그인 화면으로 이동하는지
8. `/admin/login`에서 `20262026`으로 로그인하면 `/admin`(AdminDashboardPage)으로 이동하는지, 잘못된 비밀번호는 거부되는지
9. 이전 단계에서 삭제된 화면(출판사 수동 선택 화면, 서천 지도 배경, 소단원/차시 목록 페이지)에 대한 링크나 라우트가 더 이상 존재하지 않는지

문제를 발견하면 해당 태스크의 파일로 돌아가 수정하고, `npm test`를 재실행해 회귀가 없는지 확인한다.

- [ ] **Step 4: 최종 커밋**

```bash
git status
git add -A
git commit -m "chore: final integration check for real curricula and school login"
```

변경 사항이 이미 이전 태스크들에서 모두 커밋되어 `git status`가 깨끗하다면 이 커밋은 생략한다.
