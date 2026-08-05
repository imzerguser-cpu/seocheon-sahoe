# 서천 지역화 자료 사이트 — 1단계 스캐폴드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 출판사 선택 → 대단원 → 소단원 → 차시 탐색이 가능하고, 교사/학생 공용 비밀번호 게이트와 관리자 로그인, 자료 슬롯(이미지/PDF/영상/QR) 표시 틀, 퀴즈 자리 예약까지 갖춘 React SPA를 GitHub Pages에 배포 가능한 상태로 만든다. 실제 콘텐츠(자료 파일, 전체 출판사 목차, 퀴즈 문항)는 채우지 않고 구조만 완성한다.

**Architecture:** React + Vite SPA, React Router(HashRouter)로 라우팅. 콘텐츠는 `src/data/*.json` 정적 파일로 관리하고 순수 함수(`src/lib/dataLoader.js`)로 조회한다. Firebase는 Firestore(접근 비밀번호 설정 문서)와 Authentication(관리자 로그인)만 사용한다. GitHub Actions로 GitHub Pages에 자동 배포한다.

**Tech Stack:** React 18, Vite 5, react-router-dom 6, firebase 11(Firestore + Auth), Vitest + @testing-library/react(테스트)

## Global Constraints

- 실제 자료 파일(이미지/PDF/영상)은 이번 단계에 채우지 않는다 — 자리(빈 상태 UI)만 만든다.
- 이미지 자료는 Firebase Storage가 아닌 저장소 `public/images/`에 둔다 (Firebase Storage는 2026-02-03부터 Blaze 플랜 필수).
- PDF·영상은 외부 링크(구글드라이브/유튜브)와 QR 링크 필드로만 참조한다.
- 출판사 커리큘럼 데이터는 지학사·천재교과서 2곳만 플레이스홀더로 채우고, 각 파일에 "실제 교과서와 다를 수 있음" 안내 필드(`note`)를 남긴다.
- 교사용/학생용 비밀번호는 별도 값이며 둘 다 같은 콘텐츠에 접근 가능하다.
- 관리자 비밀번호(및 교사/학생 비밀번호) 변경 UI는 사이트 내에 만들지 않는다 — Firebase 콘솔에서 수동 처리.
- 퀴즈는 문항 없이 구조(차시→소단원→대단원 집계)만 구현하고 UI는 "준비 중"으로 표시한다.
- 참조 스펙: `docs/superpowers/specs/2026-08-05-seocheon-sahoe-site-design.md`

---

## Task 1: 프로젝트 스캐폴드 (Vite + React + Router + Vitest)

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `.gitignore`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/setupTests.js`
- Create: `src/styles/theme.css`
- Test: `src/App.test.jsx`

**Interfaces:**
- Produces: `App` 컴포넌트(default export, `src/App.jsx`) — Task 7에서 라우팅으로 교체됨.

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "seocheon-sahoe",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "firebase": "^11.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^25.0.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: vite.config.js 작성**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base는 GitHub Pages 저장소 이름과 반드시 일치해야 합니다.
// 저장소 이름을 "seocheon-sahoe"가 아닌 다른 이름으로 만들면 이 값도 바꿔야 합니다.
export default defineConfig({
  plugins: [react()],
  base: '/seocheon-sahoe/',
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
  },
})
```

- [ ] **Step 3: index.html 작성**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>우리 고장 서천 - 지역화 자료</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: .gitignore 작성**

```
node_modules
dist
.env
.env.local
*.local
```

- [ ] **Step 5: src/setupTests.js 작성**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 6: src/styles/theme.css 작성 (기본 웜톤 팔레트, 세부 디자인은 이후 별도 단계에서 다듬음)**

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
```

- [ ] **Step 7: src/App.test.jsx 작성 (실패하는 테스트 먼저)**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App.jsx'

describe('App', () => {
  it('renders the site title', () => {
    render(<App />)
    expect(screen.getByText('서천 지역화 자료')).toBeInTheDocument()
  })
})
```

- [ ] **Step 8: 의존성 설치 후 테스트 실행해 실패 확인**

Run: `npm install && npm test`
Expected: FAIL — `src/App.jsx`가 없어서 import 에러

- [ ] **Step 9: src/App.jsx 최소 구현**

```jsx
function App() {
  return <div>서천 지역화 자료</div>
}

export default App
```

- [ ] **Step 10: src/main.jsx 작성**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/theme.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 11: 테스트 재실행해 통과 확인**

Run: `npm test`
Expected: PASS (1 test)

- [ ] **Step 12: 빌드 확인**

Run: `npm run build`
Expected: `dist/` 폴더 생성, 에러 없음

- [ ] **Step 13: 커밋**

```bash
git add package.json vite.config.js index.html .gitignore src
git commit -m "chore: scaffold Vite + React + Vitest project"
```

---

## Task 2: 콘텐츠 데이터 파일 (JSON)

**Files:**
- Create: `src/data/publishers.json`
- Create: `src/data/curricula/jihak.json`
- Create: `src/data/curricula/chunjae.json`
- Create: `src/data/curriculaIndex.js`
- Create: `src/data/topics.json`
- Create: `src/data/mappings.json`
- Create: `src/data/quizzes.json`

**Interfaces:**
- Produces: `curricula`(named export, `src/data/curriculaIndex.js`) — `{ [publisherId]: CurriculumObject }` 형태. Task 3의 `dataLoader.js`가 이 값을 사용한다.

- [ ] **Step 1: src/data/publishers.json 작성**

```json
[
  { "id": "jihak", "name": "지학사" },
  { "id": "chunjae", "name": "천재교과서" }
]
```

- [ ] **Step 2: src/data/curricula/jihak.json 작성**

```json
{
  "publisherId": "jihak",
  "note": "샘플 플레이스홀더 데이터입니다. 실제 지학사 교과서 목차와 다를 수 있습니다.",
  "units": [
    {
      "id": "jihak-u1",
      "title": "1. 우리가 사는 곳",
      "order": 1,
      "subunits": [
        {
          "id": "jihak-u1-s1",
          "title": "(1) 우리 주변의 장소",
          "order": 1,
          "lessons": [
            { "id": "jihak-u1-s1-l1", "title": "여러 장소에서의 경험 떠올리기", "order": 1 },
            { "id": "jihak-u1-s1-l2", "title": "장소에 대한 느낌 나누기", "order": 2 },
            { "id": "jihak-u1-s1-l3", "title": "경험과 느낌 표현하기", "order": 3 }
          ]
        },
        {
          "id": "jihak-u1-s2",
          "title": "(2) 살기 좋은 우리 지역",
          "order": 2,
          "lessons": [
            { "id": "jihak-u1-s2-l1", "title": "디지털 영상 지도로 지역 살펴보기", "order": 1 },
            { "id": "jihak-u1-s2-l2", "title": "우리 지역의 여러 장소 찾아보기", "order": 2 },
            { "id": "jihak-u1-s2-l3", "title": "살기 좋은 지역 만들기", "order": 3 }
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Step 3: src/data/curricula/chunjae.json 작성 (일부러 소단원 구성을 다르게 해 N:M 매핑을 보여줌)**

```json
{
  "publisherId": "chunjae",
  "note": "샘플 플레이스홀더 데이터입니다. 실제 천재교과서 목차와 다를 수 있습니다.",
  "units": [
    {
      "id": "chunjae-u1",
      "title": "1. 우리 고장의 모습",
      "order": 1,
      "subunits": [
        {
          "id": "chunjae-u1-s1",
          "title": "(1) 우리 고장 둘러보기",
          "order": 1,
          "lessons": [
            { "id": "chunjae-u1-s1-l1", "title": "장소에서의 경험과 느낌", "order": 1 },
            { "id": "chunjae-u1-s1-l2", "title": "느낌 표현하기", "order": 2 }
          ]
        },
        {
          "id": "chunjae-u1-s2",
          "title": "(2) 살기 좋은 우리 고장",
          "order": 2,
          "lessons": [
            { "id": "chunjae-u1-s2-l1", "title": "디지털 지도로 우리 고장 살펴보기", "order": 1 },
            { "id": "chunjae-u1-s2-l2", "title": "우리 고장의 장소 찾아보기", "order": 2 },
            { "id": "chunjae-u1-s2-l3", "title": "더 살기 좋은 고장 만들기", "order": 3 }
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Step 4: src/data/curriculaIndex.js 작성**

```js
import jihak from './curricula/jihak.json'
import chunjae from './curricula/chunjae.json'

export const curricula = {
  jihak,
  chunjae,
}
```

- [ ] **Step 5: src/data/topics.json 작성 (첨부된 서천 지역화자료 실제 목차 사용, 자료는 빈 배열)**

```json
[
  { "id": "topic_1-1-1", "대단원": "1. 우리가 사는 곳", "소단원": "(1) 우리 주변의 장소", "차시제목": "여러 장소에 대한 경험과 느낌 떠올리기 ①", "활용법": "", "resources": [] },
  { "id": "topic_1-1-2", "대단원": "1. 우리가 사는 곳", "소단원": "(1) 우리 주변의 장소", "차시제목": "여러 장소에 대한 경험과 느낌 떠올리기 ②", "활용법": "", "resources": [] },
  { "id": "topic_1-1-3", "대단원": "1. 우리가 사는 곳", "소단원": "(1) 우리 주변의 장소", "차시제목": "주변 여러 장소에서의 경험과 느낌 표현하기", "활용법": "", "resources": [] },
  { "id": "topic_1-2-1", "대단원": "1. 우리가 사는 곳", "소단원": "(2) 살기 좋은 우리 지역", "차시제목": "디지털 영상 지도로 우리 지역 살펴보기", "활용법": "", "resources": [] },
  { "id": "topic_1-2-2", "대단원": "1. 우리가 사는 곳", "소단원": "(2) 살기 좋은 우리 지역", "차시제목": "우리가 사는 곳의 여러 장소 찾아보기", "활용법": "", "resources": [] },
  { "id": "topic_1-2-3", "대단원": "1. 우리가 사는 곳", "소단원": "(2) 살기 좋은 우리 지역", "차시제목": "우리가 사는 곳을 더 살기 좋은 곳으로 만들기", "활용법": "", "resources": [] }
]
```

- [ ] **Step 6: src/data/mappings.json 작성**

```json
[
  { "topicId": "topic_1-1-1", "publisherId": "jihak", "lessonId": "jihak-u1-s1-l1" },
  { "topicId": "topic_1-1-2", "publisherId": "jihak", "lessonId": "jihak-u1-s1-l2" },
  { "topicId": "topic_1-1-3", "publisherId": "jihak", "lessonId": "jihak-u1-s1-l3" },
  { "topicId": "topic_1-2-1", "publisherId": "jihak", "lessonId": "jihak-u1-s2-l1" },
  { "topicId": "topic_1-2-2", "publisherId": "jihak", "lessonId": "jihak-u1-s2-l2" },
  { "topicId": "topic_1-2-3", "publisherId": "jihak", "lessonId": "jihak-u1-s2-l3" },
  { "topicId": "topic_1-1-1", "publisherId": "chunjae", "lessonId": "chunjae-u1-s1-l1" },
  { "topicId": "topic_1-1-2", "publisherId": "chunjae", "lessonId": "chunjae-u1-s1-l1" },
  { "topicId": "topic_1-1-3", "publisherId": "chunjae", "lessonId": "chunjae-u1-s1-l2" },
  { "topicId": "topic_1-2-1", "publisherId": "chunjae", "lessonId": "chunjae-u1-s2-l1" },
  { "topicId": "topic_1-2-2", "publisherId": "chunjae", "lessonId": "chunjae-u1-s2-l2" },
  { "topicId": "topic_1-2-3", "publisherId": "chunjae", "lessonId": "chunjae-u1-s2-l3" }
]
```

참고: `chunjae-u1-s1-l1`은 `topic_1-1-1`과 `topic_1-1-2` 둘 다에 매핑됨(N:M 구조 확인용 — 천재교과서는 두 차시를 한 차시로 묶어 다룬다고 가정).

- [ ] **Step 7: src/data/quizzes.json 작성 (빈 배열, 자리만 예약)**

```json
[]
```

- [ ] **Step 8: 커밋**

```bash
git add src/data
git commit -m "feat: add placeholder curriculum, topic, and mapping data"
```

---

## Task 3: 데이터 조회 순수 함수 (dataLoader.js)

**Files:**
- Create: `src/lib/dataLoader.js`
- Test: `src/lib/dataLoader.test.js`

**Interfaces:**
- Consumes: `curricula`(`src/data/curriculaIndex.js`), `publishers.json`, `topics.json`, `mappings.json`, `quizzes.json`
- Produces (모두 named export):
  - `selectUnits(curriculum) -> Unit[]`
  - `selectUnit(curriculum, unitId) -> Unit|null`
  - `selectSubunits(curriculum, unitId) -> Subunit[]`
  - `selectSubunit(curriculum, unitId, subunitId) -> Subunit|null`
  - `selectLessons(curriculum, unitId, subunitId) -> Lesson[]`
  - `selectLesson(curriculum, unitId, subunitId, lessonId) -> Lesson|null`
  - `selectTopicsForLesson(topicList, mappingList, publisherId, lessonId) -> Topic[]`
  - `selectQuizQuestions(quizList, scope, refId) -> Question[]`
  - `getPublishers() -> Publisher[]`
  - `getUnits(publisherId) -> Unit[]`
  - `getUnit(publisherId, unitId) -> Unit|null`
  - `getSubunits(publisherId, unitId) -> Subunit[]`
  - `getSubunit(publisherId, unitId, subunitId) -> Subunit|null`
  - `getLessons(publisherId, unitId, subunitId) -> Lesson[]`
  - `getLesson(publisherId, unitId, subunitId, lessonId) -> Lesson|null`
  - `getTopicsForLesson(publisherId, lessonId) -> Topic[]`
  - `getQuizQuestions(scope, refId) -> Question[]`

`select*` 함수는 순수 함수(데이터를 인자로 받음, 테스트용). `get*` 함수는 실제 JSON 데이터에 바인딩된 얇은 래퍼(컴포넌트에서 사용).

- [ ] **Step 1: 실패하는 테스트 작성 (src/lib/dataLoader.test.js)**

```js
import { describe, it, expect } from 'vitest'
import {
  selectUnits,
  selectUnit,
  selectSubunits,
  selectSubunit,
  selectLessons,
  selectLesson,
  selectTopicsForLesson,
  selectQuizQuestions,
  getPublishers,
  getUnits,
  getTopicsForLesson,
} from './dataLoader.js'

const sampleCurriculum = {
  units: [
    {
      id: 'u2', title: '2단원', order: 2,
      subunits: [{ id: 'u2-s1', title: '2-1', order: 1, lessons: [{ id: 'u2-s1-l1', title: 'L', order: 1 }] }],
    },
    {
      id: 'u1', title: '1단원', order: 1,
      subunits: [
        {
          id: 'u1-s1', title: '1-1', order: 1,
          lessons: [
            { id: 'u1-s1-l2', title: '두번째', order: 2 },
            { id: 'u1-s1-l1', title: '첫번째', order: 1 },
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

describe('selectSubunits / selectSubunit', () => {
  it('해당 단원의 소단원을 반환한다', () => {
    expect(selectSubunits(sampleCurriculum, 'u1')).toHaveLength(1)
  })

  it('단원이 없으면 빈 배열을 반환한다', () => {
    expect(selectSubunits(sampleCurriculum, 'nope')).toEqual([])
  })

  it('소단원을 id로 찾는다', () => {
    expect(selectSubunit(sampleCurriculum, 'u1', 'u1-s1').title).toBe('1-1')
  })
})

describe('selectLessons / selectLesson', () => {
  it('order 기준으로 정렬해서 반환한다', () => {
    expect(selectLessons(sampleCurriculum, 'u1', 'u1-s1').map((l) => l.id)).toEqual([
      'u1-s1-l1',
      'u1-s1-l2',
    ])
  })

  it('차시를 id로 찾는다', () => {
    expect(selectLesson(sampleCurriculum, 'u1', 'u1-s1', 'u1-s1-l1').title).toBe('첫번째')
  })

  it('소단원이 없으면 빈 배열을 반환한다', () => {
    expect(selectLessons(sampleCurriculum, 'u1', 'nope')).toEqual([])
  })
})

describe('selectTopicsForLesson', () => {
  const topics = [
    { id: 't1', 차시제목: '토픽1' },
    { id: 't2', 차시제목: '토픽2' },
  ]
  const mappings = [
    { topicId: 't1', publisherId: 'pub-a', lessonId: 'l1' },
    { topicId: 't2', publisherId: 'pub-a', lessonId: 'l1' },
    { topicId: 't1', publisherId: 'pub-b', lessonId: 'l9' },
  ]

  it('출판사+차시로 매핑된 토픽을 모두 반환한다 (N:M)', () => {
    const result = selectTopicsForLesson(topics, mappings, 'pub-a', 'l1')
    expect(result.map((t) => t.id)).toEqual(['t1', 't2'])
  })

  it('매핑이 없으면 빈 배열을 반환한다', () => {
    expect(selectTopicsForLesson(topics, mappings, 'pub-a', 'l404')).toEqual([])
  })
})

describe('selectQuizQuestions', () => {
  const quizzes = [
    { id: 'q1', scope: 'lesson', refId: 'l1', parentSubunitId: 's1', parentUnitId: 'u1', questions: [{ id: 'q1-a' }] },
    { id: 'q2', scope: 'lesson', refId: 'l2', parentSubunitId: 's1', parentUnitId: 'u1', questions: [{ id: 'q2-a' }] },
    { id: 'q3', scope: 'lesson', refId: 'l3', parentSubunitId: 's2', parentUnitId: 'u1', questions: [{ id: 'q3-a' }] },
  ]

  it('lesson scope는 해당 차시 문항만 반환한다', () => {
    expect(selectQuizQuestions(quizzes, 'lesson', 'l1')).toEqual([{ id: 'q1-a' }])
  })

  it('subunit scope는 소속 차시 문항을 모두 모아 반환한다', () => {
    expect(selectQuizQuestions(quizzes, 'subunit', 's1')).toEqual([{ id: 'q1-a' }, { id: 'q2-a' }])
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
  it('getPublishers는 지학사와 천재교과서를 포함한다', () => {
    const ids = getPublishers().map((p) => p.id)
    expect(ids).toEqual(expect.arrayContaining(['jihak', 'chunjae']))
  })

  it('getUnits(jihak)는 1개 대단원을 반환한다', () => {
    expect(getUnits('jihak')).toHaveLength(1)
  })

  it('getTopicsForLesson은 chunjae의 첫 차시에 매핑된 토픽 2개를 반환한다', () => {
    const topics = getTopicsForLesson('chunjae', 'chunjae-u1-s1-l1')
    expect(topics.map((t) => t.id)).toEqual(['topic_1-1-1', 'topic_1-1-2'])
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npm test`
Expected: FAIL — `src/lib/dataLoader.js` 없음

- [ ] **Step 3: src/lib/dataLoader.js 구현**

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

export function selectSubunits(curriculum, unitId) {
  const unit = selectUnit(curriculum, unitId)
  if (!unit) return []
  return [...unit.subunits].sort((a, b) => a.order - b.order)
}

export function selectSubunit(curriculum, unitId, subunitId) {
  return selectSubunits(curriculum, unitId).find((s) => s.id === subunitId) ?? null
}

export function selectLessons(curriculum, unitId, subunitId) {
  const subunit = selectSubunit(curriculum, unitId, subunitId)
  if (!subunit) return []
  return [...subunit.lessons].sort((a, b) => a.order - b.order)
}

export function selectLesson(curriculum, unitId, subunitId, lessonId) {
  return selectLessons(curriculum, unitId, subunitId).find((l) => l.id === lessonId) ?? null
}

export function selectTopicsForLesson(topicList, mappingList, publisherId, lessonId) {
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
  if (scope === 'subunit') {
    return quizList
      .filter((q) => q.scope === 'lesson' && q.parentSubunitId === refId)
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

export function getSubunits(publisherId, unitId) {
  return selectSubunits(curricula[publisherId], unitId)
}

export function getSubunit(publisherId, unitId, subunitId) {
  return selectSubunit(curricula[publisherId], unitId, subunitId)
}

export function getLessons(publisherId, unitId, subunitId) {
  return selectLessons(curricula[publisherId], unitId, subunitId)
}

export function getLesson(publisherId, unitId, subunitId, lessonId) {
  return selectLesson(curricula[publisherId], unitId, subunitId, lessonId)
}

export function getTopicsForLesson(publisherId, lessonId) {
  return selectTopicsForLesson(topicsData, mappingsData, publisherId, lessonId)
}

export function getQuizQuestions(scope, refId) {
  return selectQuizQuestions(quizzesData, scope, refId)
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npm test`
Expected: PASS (전체 테스트)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/dataLoader.js src/lib/dataLoader.test.js
git commit -m "feat: add pure data selector functions with tests"
```

---

## Task 4: Firebase 초기화 & 접근 설정 조회

**Files:**
- Create: `src/firebase.js`
- Create: `src/lib/accessConfig.js`
- Create: `.env.example`
- Create: `README.md`(Firebase 프로젝트 설정 섹션 추가 — 이 태스크에서는 Firebase 관련 부분만 작성, Task 14에서 배포 부분 추가)

**Interfaces:**
- Produces: `app`, `db`, `auth`(named exports, `src/firebase.js`), `fetchAccessConfig() -> Promise<{teacherPasscode, studentPasscode}|null>`(named export, `src/lib/accessConfig.js`)
- 이 태스크는 실제 Firebase 프로젝트가 필요해 자동화된 유닛 테스트를 작성하지 않는다. 대신 수동 확인 절차를 Step에 명시한다.

- [ ] **Step 1: .env.example 작성**

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

- [ ] **Step 2: src/firebase.js 작성**

```js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
```

- [ ] **Step 3: src/lib/accessConfig.js 작성**

```js
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

export async function fetchAccessConfig() {
  const snap = await getDoc(doc(db, 'config', 'access'))
  if (!snap.exists()) return null
  return snap.data()
}
```

- [ ] **Step 4: README.md 작성 (Firebase 설정 섹션)**

```markdown
# 서천 지역화 자료 사이트

## Firebase 프로젝트 설정 (최초 1회)

1. https://console.firebase.google.com 에서 새 프로젝트 생성
2. Authentication → 로그인 방법 → "이메일/비밀번호" 사용 설정, 관리자 계정 1개 수동 생성
3. Firestore Database 생성 (프로덕션 모드)
4. Firestore에 `config` 컬렉션 → `access` 문서 생성, 아래 필드 추가:
   - `teacherPasscode` (string): 교사용 비밀번호
   - `studentPasscode` (string): 학생용 비밀번호
5. 프로젝트 설정 → 웹 앱 추가 → 표시된 설정값을 `.env.local`에 복사 (`.env.example` 참고)
6. 교사/학생 비밀번호를 바꾸려면 Firestore 콘솔에서 `config/access` 문서를 직접 수정한다. 관리자 계정 비밀번호를 바꾸려면 Authentication 콘솔에서 직접 재설정한다. (사이트 내 변경 UI 없음)

## 개발 환경 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev
```
```

- [ ] **Step 5: 수동 확인 (자동화 테스트 없음 — Firebase 프로젝트 준비 후 확인)**

`.env.local`에 실제 Firebase 설정값을 채운 뒤 `npm run dev`로 실행했을 때 콘솔에 Firebase 초기화 에러가 없는지 확인한다. (이번 플랜 실행 시점에 실제 Firebase 프로젝트가 없다면 이 스텝은 건너뛰고 다음 태스크로 진행해도 된다 — Task 6/12에서 로그인 기능을 붙일 때 함께 확인한다.)

- [ ] **Step 6: 커밋**

```bash
git add src/firebase.js src/lib/accessConfig.js .env.example README.md
git commit -m "feat: add Firebase initialization and access config fetcher"
```

---

## Task 5: 인증 세션 로직 (auth.js + AuthContext)

**Files:**
- Create: `src/lib/auth.js`
- Test: `src/lib/auth.test.js`
- Create: `src/contexts/AuthContext.jsx`

**Interfaces:**
- Consumes: 없음 (순수 로직 + localStorage)
- Produces:
  - `saveSession(role)`, `getSession() -> {role, unlockedAt}|null`, `clearSession()`, `isUnlocked() -> boolean`, `matchPasscode(accessConfig, inputPasscode) -> 'teacher'|'student'|null` (named exports, `src/lib/auth.js`)
  - `AuthProvider`(컴포넌트), `useAuth() -> {session, login(role), logout()}` (named exports, `src/contexts/AuthContext.jsx`) — Task 6/7에서 사용

- [ ] **Step 1: 실패하는 테스트 작성 (src/lib/auth.test.js)**

```js
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
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npm test`
Expected: FAIL — `src/lib/auth.js` 없음

- [ ] **Step 3: src/lib/auth.js 구현**

```js
const SESSION_KEY = 'seocheon-sahoe:session'

export function saveSession(role) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ role, unlockedAt: Date.now() }))
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function isUnlocked() {
  return getSession() !== null
}

export function matchPasscode(accessConfig, inputPasscode) {
  if (!accessConfig || !inputPasscode) return null
  if (inputPasscode === accessConfig.teacherPasscode) return 'teacher'
  if (inputPasscode === accessConfig.studentPasscode) return 'student'
  return null
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npm test`
Expected: PASS (전체 테스트)

- [ ] **Step 5: src/contexts/AuthContext.jsx 작성**

```jsx
import { createContext, useContext, useState, useCallback } from 'react'
import { getSession, saveSession, clearSession } from '../lib/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession())

  const login = useCallback((role) => {
    saveSession(role)
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

- [ ] **Step 6: 커밋**

```bash
git add src/lib/auth.js src/lib/auth.test.js src/contexts/AuthContext.jsx
git commit -m "feat: add session auth logic and AuthContext"
```

---

## Task 6: 로그인 페이지 & 라우트 보호

**Files:**
- Create: `src/pages/LoginPage.jsx`
- Test: `src/pages/LoginPage.test.jsx`
- Create: `src/components/ProtectedRoute.jsx`

**Interfaces:**
- Consumes: `useAuth()`(`src/contexts/AuthContext.jsx`), `fetchAccessConfig()`(`src/lib/accessConfig.js`), `matchPasscode()`(`src/lib/auth.js`)
- Produces: `LoginPage`(default export), `ProtectedRoute`(default export) — Task 7 라우팅에서 사용

- [ ] **Step 1: 실패하는 테스트 작성 (src/pages/LoginPage.test.jsx)**

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage.jsx'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import { fetchAccessConfig } from '../lib/accessConfig.js'

vi.mock('../lib/accessConfig.js', () => ({
  fetchAccessConfig: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

function renderLoginPage() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('LoginPage', () => {
  it('올바른 비밀번호를 입력하면 에러 메시지가 없다', async () => {
    fetchAccessConfig.mockResolvedValue({
      teacherPasscode: 'teach123',
      studentPasscode: 'stud123',
    })
    renderLoginPage()

    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'teach123' } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  it('틀린 비밀번호를 입력하면 에러 메시지를 보여준다', async () => {
    fetchAccessConfig.mockResolvedValue({
      teacherPasscode: 'teach123',
      studentPasscode: 'stud123',
    })
    renderLoginPage()

    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: '입장하기' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('비밀번호가 올바르지 않아요')
    })
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npm test`
Expected: FAIL — `src/pages/LoginPage.jsx` 없음

- [ ] **Step 3: src/pages/LoginPage.jsx 구현**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { fetchAccessConfig } from '../lib/accessConfig.js'
import { matchPasscode } from '../lib/auth.js'

export default function LoginPage() {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const config = await fetchAccessConfig()
      const role = matchPasscode(config, passcode)
      if (!role) {
        setError('비밀번호가 올바르지 않아요. 다시 확인해 주세요.')
        return
      }
      login(role)
      navigate('/')
    } catch {
      setError('접속 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <h1>우리 고장 서천 지역화 자료</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="passcode">비밀번호</label>
        <input
          id="passcode"
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="선생님 또는 학생 비밀번호를 입력하세요"
        />
        <button type="submit" disabled={loading}>
          {loading ? '확인 중...' : '입장하기'}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  )
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npm test`
Expected: PASS (전체 테스트)

- [ ] **Step 5: src/components/ProtectedRoute.jsx 작성**

```jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function ProtectedRoute() {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}
```

- [ ] **Step 6: 커밋**

```bash
git add src/pages/LoginPage.jsx src/pages/LoginPage.test.jsx src/components/ProtectedRoute.jsx
git commit -m "feat: add login page and protected route guard"
```

---

## Task 7: 라우팅 연결 (App.jsx)

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/main.jsx`
- Modify: `src/App.test.jsx`
- Create: `src/pages/PublisherSelectPage.jsx` (Task 8에서 완성할 임시 스텁)
- Create: `src/pages/AdminLoginPage.jsx` (Task 12에서 완성할 임시 스텁)
- Create: `src/pages/AdminDashboardPage.jsx` (Task 12에서 완성할 임시 스텁)
- Create: `src/components/AdminRoute.jsx`

**Interfaces:**
- Consumes: `AuthProvider`, `useAuth`(`src/contexts/AuthContext.jsx`), `ProtectedRoute`(`src/components/ProtectedRoute.jsx`), `LoginPage`(`src/pages/LoginPage.jsx`), `auth`(`src/firebase.js`)
- Produces: 전체 라우트 트리 — 이후 태스크들이 각 페이지 스텁을 실제 구현으로 교체한다.

이 태스크는 다른 태스크들(8~12)이 만들 페이지들을 미리 최소 스텁으로 연결해 전체 네비게이션 흐름이 동작하는지 먼저 검증하기 위한 것이다. 각 스텁은 이후 태스크에서 실제 UI로 교체된다.

- [ ] **Step 1: src/components/AdminRoute.jsx 작성 (Firebase Auth 상태 확인)**

```jsx
import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase.js'

export default function AdminRoute() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setStatus(user ? 'authed' : 'anonymous')
    })
    return unsubscribe
  }, [])

  if (status === 'loading') return <p>확인 중...</p>
  if (status === 'anonymous') return <Navigate to="/admin/login" replace />
  return <Outlet />
}
```

- [ ] **Step 2: 스텁 페이지 3개 작성**

```jsx
// src/pages/PublisherSelectPage.jsx
export default function PublisherSelectPage() {
  return <div>출판사 선택 (준비 중)</div>
}
```

```jsx
// src/pages/AdminLoginPage.jsx
export default function AdminLoginPage() {
  return <div>관리자 로그인 (준비 중)</div>
}
```

```jsx
// src/pages/AdminDashboardPage.jsx
export default function AdminDashboardPage() {
  return <div>관리자 대시보드 (준비 중)</div>
}
```

- [ ] **Step 3: src/App.jsx를 라우팅 트리로 교체**

```jsx
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import PublisherSelectPage from './pages/PublisherSelectPage.jsx'
import AdminLoginPage from './pages/AdminLoginPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<PublisherSelectPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
```

- [ ] **Step 4: src/main.jsx에 HashRouter 적용**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/theme.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
```

GitHub Pages는 별도 서버 설정 없이는 딥링크 새로고침 시 404가 나기 때문에, `HashRouter`(URL이 `#/...` 형태)를 사용해 이 문제를 피한다.

- [ ] **Step 5: src/App.test.jsx를 라우팅 구조에 맞게 갱신**

`App`은 `AdminRoute`를 통해 `firebase/auth`와 `../firebase.js`를 실제로 불러오므로, 실제 Firebase 프로젝트 설정 없이 테스트가 안정적으로 동작하도록 두 모듈을 명시적으로 모킹한다.

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, callback) => {
    callback(null)
    return () => {}
  },
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('./firebase.js', () => ({ auth: {} }))

describe('App', () => {
  it('로그인 전에는 로그인 페이지로 리다이렉트된다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('우리 고장 서천 지역화 자료')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: 테스트 실행해 통과 확인**

Run: `npm test`
Expected: PASS (전체 테스트)

- [ ] **Step 7: 개발 서버로 수동 확인**

Run: `npm run dev`
Expected: `/`(루트) 접속 시 로그인 페이지로 리다이렉트되고, `/admin` 접속 시 관리자 로그인 페이지로 리다이렉트된다.

- [ ] **Step 8: 커밋**

```bash
git add src/App.jsx src/App.test.jsx src/main.jsx src/components/AdminRoute.jsx src/pages/PublisherSelectPage.jsx src/pages/AdminLoginPage.jsx src/pages/AdminDashboardPage.jsx
git commit -m "feat: wire up full route tree with stub pages"
```

---

## Task 8: 출판사 선택 화면 (서천 읍면 배경 지도 포함)

**Files:**
- Create: `src/components/SeocheonMapBackground.jsx`
- Test: `src/components/SeocheonMapBackground.test.jsx`
- Create: `src/components/PublisherSelector.jsx`
- Create: `src/lib/publisherPreference.js`
- Test: `src/lib/publisherPreference.test.js`
- Modify: `src/pages/PublisherSelectPage.jsx` (Task 7의 스텁을 실제 구현으로 교체)
- Test: `src/pages/PublisherSelectPage.test.jsx`
- Modify: `src/styles/theme.css`

**Interfaces:**
- Consumes: `getPublishers()`(`src/lib/dataLoader.js`)
- Produces: `saveSelectedPublisher(publisherId)`, `getSelectedPublisher() -> string|null`(named exports, `src/lib/publisherPreference.js`) — Task 9 이후에서도 재사용 가능

- [ ] **Step 1: 실패하는 테스트 작성 (src/lib/publisherPreference.test.js)**

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { saveSelectedPublisher, getSelectedPublisher } from './publisherPreference.js'

beforeEach(() => {
  localStorage.clear()
})

describe('publisherPreference', () => {
  it('저장한 적이 없으면 null을 반환한다', () => {
    expect(getSelectedPublisher()).toBeNull()
  })

  it('선택한 출판사를 저장하고 불러올 수 있다', () => {
    saveSelectedPublisher('jihak')
    expect(getSelectedPublisher()).toBe('jihak')
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npm test`
Expected: FAIL — `src/lib/publisherPreference.js` 없음

- [ ] **Step 3: src/lib/publisherPreference.js 구현**

```js
const KEY = 'seocheon-sahoe:selected-publisher'

export function saveSelectedPublisher(publisherId) {
  localStorage.setItem(KEY, publisherId)
}

export function getSelectedPublisher() {
  return localStorage.getItem(KEY)
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npm test`
Expected: PASS (전체 테스트)

- [ ] **Step 5: src/components/SeocheonMapBackground.test.jsx 작성 (실패 확인 후 구현)**

```jsx
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SeocheonMapBackground from './SeocheonMapBackground.jsx'

describe('SeocheonMapBackground', () => {
  it('장식용 svg를 렌더링한다 (스크린리더에서 숨김)', () => {
    const { container } = render(<SeocheonMapBackground />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})
```

Run: `npm test` → FAIL 확인 (`src/components/SeocheonMapBackground.jsx` 없음)

- [ ] **Step 6: src/components/SeocheonMapBackground.jsx 구현**

간단화된(실측 GIS 데이터 아님) 서천군 13개 읍면 느낌의 귀여운 배경 일러스트. 낮은 투명도로 장식용(`aria-hidden`)으로만 사용한다.

```jsx
const REGIONS = [
  { name: '서천읍', cx: 180, cy: 220, rx: 55, ry: 40, color: '#ffd9a8' },
  { name: '장항읍', cx: 90, cy: 300, rx: 50, ry: 45, color: '#a8e6cf' },
  { name: '마서면', cx: 220, cy: 160, rx: 45, ry: 35, color: '#ffd9a8' },
  { name: '화양면', cx: 130, cy: 130, rx: 45, ry: 35, color: '#a8e6cf' },
  { name: '기산면', cx: 260, cy: 230, rx: 40, ry: 35, color: '#ffe0b2' },
  { name: '한산면', cx: 310, cy: 190, rx: 45, ry: 38, color: '#c8f0d8' },
  { name: '마산면', cx: 350, cy: 250, rx: 42, ry: 34, color: '#ffd9a8' },
  { name: '시초면', cx: 300, cy: 300, rx: 40, ry: 34, color: '#a8e6cf' },
  { name: '문산면', cx: 250, cy: 340, rx: 42, ry: 34, color: '#ffe0b2' },
  { name: '판교면', cx: 340, cy: 340, rx: 45, ry: 36, color: '#c8f0d8' },
  { name: '종천면', cx: 190, cy: 300, rx: 42, ry: 34, color: '#ffd9a8' },
  { name: '비인면', cx: 140, cy: 380, rx: 48, ry: 38, color: '#a8e6cf' },
  { name: '서면', cx: 80, cy: 420, rx: 50, ry: 40, color: '#ffe0b2' },
]

export default function SeocheonMapBackground() {
  return (
    <svg
      className="seocheon-map-background"
      viewBox="0 0 420 480"
      aria-hidden="true"
      focusable="false"
    >
      {REGIONS.map((region) => (
        <ellipse
          key={region.name}
          cx={region.cx}
          cy={region.cy}
          rx={region.rx}
          ry={region.ry}
          fill={region.color}
          opacity="0.12"
        />
      ))}
    </svg>
  )
}
```

- [ ] **Step 7: 테스트 재실행해 통과 확인**

Run: `npm test`
Expected: PASS (전체 테스트)

- [ ] **Step 8: src/components/PublisherSelector.jsx 작성**

```jsx
export default function PublisherSelector({ publishers, onSelect }) {
  return (
    <div className="publisher-grid" role="list">
      {publishers.map((publisher) => (
        <button
          key={publisher.id}
          role="listitem"
          type="button"
          className="publisher-card"
          onClick={() => onSelect(publisher.id)}
        >
          {publisher.name}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 9: src/pages/PublisherSelectPage.test.jsx 작성 (실패 확인)**

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PublisherSelectPage from './PublisherSelectPage.jsx'
import { getSelectedPublisher } from '../lib/publisherPreference.js'

beforeEach(() => {
  localStorage.clear()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<PublisherSelectPage />} />
        <Route path="/p/:publisherId" element={<div>대단원 목록 페이지</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PublisherSelectPage', () => {
  it('출판사 카드를 보여준다', () => {
    renderPage()
    expect(screen.getByText('지학사')).toBeInTheDocument()
    expect(screen.getByText('천재교과서')).toBeInTheDocument()
  })

  it('출판사를 선택하면 대단원 목록으로 이동하고 선택을 저장한다', () => {
    renderPage()
    fireEvent.click(screen.getByText('지학사'))
    expect(screen.getByText('대단원 목록 페이지')).toBeInTheDocument()
    expect(getSelectedPublisher()).toBe('jihak')
  })

  it('이전에 선택한 출판사가 있으면 이어서 보기 버튼을 보여준다', () => {
    localStorage.setItem('seocheon-sahoe:selected-publisher', 'chunjae')
    renderPage()
    expect(screen.getByText('이어서 보기: 천재교과서')).toBeInTheDocument()
  })
})
```

Run: `npm test` → FAIL 확인 (스텁 페이지에는 해당 텍스트/동작 없음)

- [ ] **Step 10: src/pages/PublisherSelectPage.jsx를 실제 구현으로 교체**

```jsx
import { useNavigate } from 'react-router-dom'
import { getPublishers } from '../lib/dataLoader.js'
import { saveSelectedPublisher, getSelectedPublisher } from '../lib/publisherPreference.js'
import PublisherSelector from '../components/PublisherSelector.jsx'
import SeocheonMapBackground from '../components/SeocheonMapBackground.jsx'

export default function PublisherSelectPage() {
  const navigate = useNavigate()
  const publishers = getPublishers()
  const lastPublisherId = getSelectedPublisher()
  const lastPublisher = publishers.find((p) => p.id === lastPublisherId)

  function handleSelect(publisherId) {
    saveSelectedPublisher(publisherId)
    navigate(`/p/${publisherId}`)
  }

  return (
    <main className="publisher-select-page">
      <SeocheonMapBackground />
      <div className="publisher-select-content">
        <h1>어떤 사회 교과서를 쓰고 있나요?</h1>
        {lastPublisher && (
          <button type="button" className="resume-button" onClick={() => handleSelect(lastPublisher.id)}>
            이어서 보기: {lastPublisher.name}
          </button>
        )}
        <PublisherSelector publishers={publishers} onSelect={handleSelect} />
      </div>
    </main>
  )
}
```

- [ ] **Step 11: 테스트 재실행해 통과 확인**

Run: `npm test`
Expected: PASS (전체 테스트)

- [ ] **Step 12: src/styles/theme.css에 레이아웃 스타일 추가**

```css
.publisher-select-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.seocheon-map-background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.publisher-select-content {
  position: relative;
  z-index: 1;
  padding: 48px 24px;
  text-align: center;
}

.publisher-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  max-width: 640px;
  margin: 24px auto 0;
}

.publisher-card {
  background: white;
  border: 2px solid var(--color-primary);
  color: var(--color-primary-dark);
  border-radius: var(--radius-lg);
  padding: 24px 12px;
  font-size: 1.1rem;
  font-weight: 700;
}

.resume-button {
  background: var(--color-accent);
  margin-bottom: 16px;
}
```

- [ ] **Step 13: App.jsx에서 PublisherSelectPage import 경로는 이미 Task 7에서 연결되어 있으므로 그대로 사용 (변경 없음, 동작만 재확인)**

Run: `npm run dev` 후 `/`(로그인 통과 후)에서 출판사 카드와 배경 지도가 보이는지, 카드를 클릭하면 `/p/jihak` 등으로 이동하는지 수동 확인한다.

- [ ] **Step 14: 커밋**

```bash
git add src/components/SeocheonMapBackground.jsx src/components/SeocheonMapBackground.test.jsx src/components/PublisherSelector.jsx src/lib/publisherPreference.js src/lib/publisherPreference.test.js src/pages/PublisherSelectPage.jsx src/pages/PublisherSelectPage.test.jsx src/styles/theme.css
git commit -m "feat: implement publisher selection page with decorative map background"
```

---

## Task 9: 대단원/소단원/차시 목록 페이지

**Files:**
- Create: `src/components/EntityCardList.jsx`
- Test: `src/components/EntityCardList.test.jsx`
- Create: `src/components/UnitBreadcrumb.jsx`
- Test: `src/components/UnitBreadcrumb.test.jsx`
- Create: `src/pages/UnitListPage.jsx`
- Test: `src/pages/UnitListPage.test.jsx`
- Create: `src/pages/SubunitListPage.jsx`
- Test: `src/pages/SubunitListPage.test.jsx`
- Create: `src/pages/LessonListPage.jsx`
- Test: `src/pages/LessonListPage.test.jsx`
- Modify: `src/App.jsx` (라우트 3개 추가)
- Modify: `src/styles/theme.css`

**Interfaces:**
- Consumes: `getUnits`, `getUnit`, `getSubunits`, `getSubunit`, `getLessons`, `getPublishers`(`src/lib/dataLoader.js`)
- Produces: `EntityCardList`(default export, props: `items`, `getHref`, `emptyMessage`), `UnitBreadcrumb`(default export, props: `trail`, `current`) — Task 10에서도 재사용

- [ ] **Step 1: 실패하는 테스트 작성 (src/components/EntityCardList.test.jsx)**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import EntityCardList from './EntityCardList.jsx'

describe('EntityCardList', () => {
  it('항목이 있으면 링크 목록을 렌더링한다', () => {
    render(
      <MemoryRouter>
        <EntityCardList
          items={[
            { id: 'a', title: 'A단원' },
            { id: 'b', title: 'B단원' },
          ]}
          getHref={(item) => `/x/${item.id}`}
          emptyMessage="없음"
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('A단원')).toHaveAttribute('href', '/x/a')
    expect(screen.getByText('B단원')).toHaveAttribute('href', '/x/b')
  })

  it('항목이 없으면 안내 문구를 보여준다', () => {
    render(
      <MemoryRouter>
        <EntityCardList items={[]} getHref={() => '/'} emptyMessage="아직 없어요" />
      </MemoryRouter>,
    )
    expect(screen.getByText('아직 없어요')).toBeInTheDocument()
  })
})
```

Run: `npm test` → FAIL 확인

- [ ] **Step 2: src/components/EntityCardList.jsx 구현**

```jsx
import { Link } from 'react-router-dom'

export default function EntityCardList({ items, getHref, emptyMessage }) {
  if (items.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>
  }
  return (
    <ul className="entity-card-list">
      {items.map((item) => (
        <li key={item.id}>
          <Link to={getHref(item)} className="entity-card">
            {item.title}
          </Link>
        </li>
      ))}
    </ul>
  )
}
```

Run: `npm test` → PASS 확인

- [ ] **Step 3: 실패하는 테스트 작성 (src/components/UnitBreadcrumb.test.jsx)**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import UnitBreadcrumb from './UnitBreadcrumb.jsx'

describe('UnitBreadcrumb', () => {
  it('경로 링크와 현재 위치를 렌더링한다', () => {
    render(
      <MemoryRouter>
        <UnitBreadcrumb
          trail={[
            { href: '/p/jihak', label: '지학사' },
            { href: '/p/jihak/u1', label: '1단원' },
          ]}
          current="1-1 소단원"
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('출판사 선택')).toHaveAttribute('href', '/')
    expect(screen.getByText('지학사')).toHaveAttribute('href', '/p/jihak')
    expect(screen.getByText('1단원')).toHaveAttribute('href', '/p/jihak/u1')
    expect(screen.getByText('1-1 소단원')).toBeInTheDocument()
  })
})
```

Run: `npm test` → FAIL 확인

- [ ] **Step 4: src/components/UnitBreadcrumb.jsx 구현**

```jsx
import { Link } from 'react-router-dom'

export default function UnitBreadcrumb({ trail = [], current }) {
  return (
    <nav className="breadcrumb" aria-label="이동 경로">
      <Link to="/">출판사 선택</Link>
      {trail.map((item) => (
        <span key={item.href}>
          <span className="breadcrumb-sep">›</span>
          <Link to={item.href}>{item.label}</Link>
        </span>
      ))}
      {current && (
        <span>
          <span className="breadcrumb-sep">›</span>
          <span>{current}</span>
        </span>
      )}
    </nav>
  )
}
```

Run: `npm test` → PASS 확인

- [ ] **Step 5: 실패하는 테스트 작성 (src/pages/UnitListPage.test.jsx)**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import UnitListPage from './UnitListPage.jsx'

function renderWithRoute(publisherId) {
  return render(
    <MemoryRouter initialEntries={[`/p/${publisherId}`]}>
      <Routes>
        <Route path="/p/:publisherId" element={<UnitListPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('UnitListPage', () => {
  it('지학사의 대단원 목록을 보여준다', () => {
    renderWithRoute('jihak')
    expect(screen.getByText('1. 우리가 사는 곳')).toBeInTheDocument()
  })
})
```

Run: `npm test` → FAIL 확인 (`src/pages/UnitListPage.jsx` 없음)

- [ ] **Step 6: src/pages/UnitListPage.jsx 구현**

```jsx
import { useParams } from 'react-router-dom'
import { getUnits, getPublishers } from '../lib/dataLoader.js'
import EntityCardList from '../components/EntityCardList.jsx'
import UnitBreadcrumb from '../components/UnitBreadcrumb.jsx'

export default function UnitListPage() {
  const { publisherId } = useParams()
  const publisher = getPublishers().find((p) => p.id === publisherId)
  const units = getUnits(publisherId)

  return (
    <main>
      <UnitBreadcrumb trail={[]} current={publisher ? publisher.name : publisherId} />
      <h1>{publisher ? publisher.name : publisherId} — 대단원</h1>
      <EntityCardList
        items={units}
        getHref={(unit) => `/p/${publisherId}/${unit.id}`}
        emptyMessage="아직 등록된 대단원이 없어요."
      />
    </main>
  )
}
```

Run: `npm test` → PASS 확인

- [ ] **Step 7: 실패하는 테스트 작성 (src/pages/SubunitListPage.test.jsx)**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SubunitListPage from './SubunitListPage.jsx'

function renderWithRoute(publisherId, unitId) {
  return render(
    <MemoryRouter initialEntries={[`/p/${publisherId}/${unitId}`]}>
      <Routes>
        <Route path="/p/:publisherId/:unitId" element={<SubunitListPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SubunitListPage', () => {
  it('지학사 1단원의 소단원 목록을 보여준다', () => {
    renderWithRoute('jihak', 'jihak-u1')
    expect(screen.getByText('(1) 우리 주변의 장소')).toBeInTheDocument()
    expect(screen.getByText('(2) 살기 좋은 우리 지역')).toBeInTheDocument()
  })
})
```

Run: `npm test` → FAIL 확인

- [ ] **Step 8: src/pages/SubunitListPage.jsx 구현**

```jsx
import { useParams } from 'react-router-dom'
import { getSubunits, getUnit, getPublishers } from '../lib/dataLoader.js'
import EntityCardList from '../components/EntityCardList.jsx'
import UnitBreadcrumb from '../components/UnitBreadcrumb.jsx'

export default function SubunitListPage() {
  const { publisherId, unitId } = useParams()
  const publisher = getPublishers().find((p) => p.id === publisherId)
  const unit = getUnit(publisherId, unitId)
  const subunits = getSubunits(publisherId, unitId)

  return (
    <main>
      <UnitBreadcrumb
        trail={[{ href: `/p/${publisherId}`, label: publisher ? publisher.name : publisherId }]}
        current={unit ? unit.title : unitId}
      />
      <h1>{unit ? unit.title : unitId} — 소단원</h1>
      <EntityCardList
        items={subunits}
        getHref={(subunit) => `/p/${publisherId}/${unitId}/${subunit.id}`}
        emptyMessage="아직 등록된 소단원이 없어요."
      />
    </main>
  )
}
```

Run: `npm test` → PASS 확인

- [ ] **Step 9: 실패하는 테스트 작성 (src/pages/LessonListPage.test.jsx)**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LessonListPage from './LessonListPage.jsx'

function renderWithRoute(publisherId, unitId, subunitId) {
  return render(
    <MemoryRouter initialEntries={[`/p/${publisherId}/${unitId}/${subunitId}`]}>
      <Routes>
        <Route path="/p/:publisherId/:unitId/:subunitId" element={<LessonListPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LessonListPage', () => {
  it('지학사 1-1 소단원의 차시 목록을 보여준다', () => {
    renderWithRoute('jihak', 'jihak-u1', 'jihak-u1-s1')
    expect(screen.getByText('여러 장소에서의 경험 떠올리기')).toBeInTheDocument()
    expect(screen.getByText('장소에 대한 느낌 나누기')).toBeInTheDocument()
    expect(screen.getByText('경험과 느낌 표현하기')).toBeInTheDocument()
  })
})
```

Run: `npm test` → FAIL 확인

- [ ] **Step 10: src/pages/LessonListPage.jsx 구현**

```jsx
import { useParams } from 'react-router-dom'
import { getLessons, getUnit, getSubunit, getPublishers } from '../lib/dataLoader.js'
import EntityCardList from '../components/EntityCardList.jsx'
import UnitBreadcrumb from '../components/UnitBreadcrumb.jsx'

export default function LessonListPage() {
  const { publisherId, unitId, subunitId } = useParams()
  const publisher = getPublishers().find((p) => p.id === publisherId)
  const unit = getUnit(publisherId, unitId)
  const subunit = getSubunit(publisherId, unitId, subunitId)
  const lessons = getLessons(publisherId, unitId, subunitId)

  return (
    <main>
      <UnitBreadcrumb
        trail={[
          { href: `/p/${publisherId}`, label: publisher ? publisher.name : publisherId },
          { href: `/p/${publisherId}/${unitId}`, label: unit ? unit.title : unitId },
        ]}
        current={subunit ? subunit.title : subunitId}
      />
      <h1>{subunit ? subunit.title : subunitId} — 차시</h1>
      <EntityCardList
        items={lessons}
        getHref={(lesson) => `/p/${publisherId}/${unitId}/${subunitId}/${lesson.id}`}
        emptyMessage="아직 등록된 차시가 없어요."
      />
    </main>
  )
}
```

Run: `npm test` → PASS 확인

- [ ] **Step 11: src/App.jsx에 라우트 3개 추가**

`ProtectedRoute`로 감싼 블록 안, `PublisherSelectPage` 라우트 아래에 다음 3줄을 추가한다:

```jsx
          <Route path="/p/:publisherId" element={<UnitListPage />} />
          <Route path="/p/:publisherId/:unitId" element={<SubunitListPage />} />
          <Route path="/p/:publisherId/:unitId/:subunitId" element={<LessonListPage />} />
```

파일 상단 import에 다음을 추가한다:

```jsx
import UnitListPage from './pages/UnitListPage.jsx'
import SubunitListPage from './pages/SubunitListPage.jsx'
import LessonListPage from './pages/LessonListPage.jsx'
```

- [ ] **Step 12: src/styles/theme.css에 목록/브레드크럼 스타일 추가**

```css
.breadcrumb {
  font-size: 0.9rem;
  color: var(--color-primary-dark);
  margin-bottom: 16px;
}

.breadcrumb-sep {
  margin: 0 6px;
}

.entity-card-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 12px;
}

.entity-card {
  display: block;
  background: white;
  border: 2px solid var(--color-accent);
  border-radius: var(--radius-md);
  padding: 16px;
  text-decoration: none;
  color: var(--color-text);
  font-weight: 600;
}

.empty-state {
  color: #a08b73;
  font-style: italic;
}
```

- [ ] **Step 13: 전체 테스트 및 개발 서버로 확인**

Run: `npm test`
Expected: PASS (전체 테스트)

Run: `npm run dev` 후 로그인 → 출판사 선택 → 대단원 → 소단원 → 차시까지 클릭으로 이동되는지 확인한다.

- [ ] **Step 14: 커밋**

```bash
git add src/components/EntityCardList.jsx src/components/EntityCardList.test.jsx src/components/UnitBreadcrumb.jsx src/components/UnitBreadcrumb.test.jsx src/pages/UnitListPage.jsx src/pages/UnitListPage.test.jsx src/pages/SubunitListPage.jsx src/pages/SubunitListPage.test.jsx src/pages/LessonListPage.jsx src/pages/LessonListPage.test.jsx src/App.jsx src/styles/theme.css
git commit -m "feat: add unit/subunit/lesson drill-down pages"
```

---

## Task 10: 차시 상세 페이지 & 자료 카드

**Files:**
- Create: `src/components/ResourceCard.jsx`
- Test: `src/components/ResourceCard.test.jsx`
- Create: `src/pages/LessonDetailPage.jsx`
- Test: `src/pages/LessonDetailPage.test.jsx`
- Modify: `src/App.jsx` (라우트 1개 추가)
- Modify: `src/styles/theme.css`

**Interfaces:**
- Consumes: `getUnit`, `getSubunit`, `getLesson`, `getPublishers`, `getTopicsForLesson`(`src/lib/dataLoader.js`), `UnitBreadcrumb`(`src/components/UnitBreadcrumb.jsx`)
- Produces: `ResourceCard`(default export, props: `resource`) — 자료 타입(`image`/`pdf`/`video`/`qr`)별 슬롯 표시

- [ ] **Step 1: 실패하는 테스트 작성 (src/components/ResourceCard.test.jsx)**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ResourceCard from './ResourceCard.jsx'

describe('ResourceCard', () => {
  it('링크가 있는 자료는 "자료 열기" 링크를 보여준다', () => {
    render(<ResourceCard resource={{ type: 'pdf', title: '학습지', url: 'https://example.com/a.pdf' }} />)
    expect(screen.getByText('학습지')).toBeInTheDocument()
    expect(screen.getByText('자료 열기')).toHaveAttribute('href', 'https://example.com/a.pdf')
  })

  it('링크가 없으면 준비 중 문구를 보여준다', () => {
    render(<ResourceCard resource={{ type: 'video', title: '영상 자료' }} />)
    expect(screen.getByText('링크 준비 중')).toBeInTheDocument()
  })
})
```

Run: `npm test` → FAIL 확인

- [ ] **Step 2: src/components/ResourceCard.jsx 구현**

```jsx
const TYPE_LABELS = {
  image: '🖼️ 이미지',
  pdf: '📄 PDF',
  video: '🎬 영상',
  qr: '📱 QR 링크',
}

export default function ResourceCard({ resource }) {
  const label = TYPE_LABELS[resource.type] ?? resource.type

  return (
    <div className="resource-card">
      <span className="resource-type">{label}</span>
      <p className="resource-title">{resource.title || '제목 미정'}</p>
      {resource.type === 'image' && resource.src && (
        <img src={resource.src} alt={resource.title || '자료 이미지'} />
      )}
      {resource.url && (
        <a href={resource.url} target="_blank" rel="noreferrer">
          자료 열기
        </a>
      )}
      {!resource.url && resource.type !== 'image' && <p className="resource-pending">링크 준비 중</p>}
    </div>
  )
}
```

Run: `npm test` → PASS 확인

- [ ] **Step 3: 실패하는 테스트 작성 (src/pages/LessonDetailPage.test.jsx)**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LessonDetailPage from './LessonDetailPage.jsx'

function renderPage(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/p/:publisherId/:unitId/:subunitId/:lessonId" element={<LessonDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LessonDetailPage', () => {
  it('매핑된 토픽 제목과 자료 준비 중 문구를 보여준다', () => {
    renderPage('/p/jihak/jihak-u1/jihak-u1-s1/jihak-u1-s1-l1')
    expect(screen.getByText('여러 장소에 대한 경험과 느낌 떠올리기 ①')).toBeInTheDocument()
    expect(screen.getByText('자료 준비 중입니다.')).toBeInTheDocument()
  })

  it('천재교과서의 병합된 차시는 매핑된 토픽 2개를 모두 보여준다', () => {
    renderPage('/p/chunjae/chunjae-u1/chunjae-u1-s1/chunjae-u1-s1-l1')
    expect(screen.getByText('여러 장소에 대한 경험과 느낌 떠올리기 ①')).toBeInTheDocument()
    expect(screen.getByText('여러 장소에 대한 경험과 느낌 떠올리기 ②')).toBeInTheDocument()
  })

  it('퀴즈 풀기 링크를 보여준다', () => {
    renderPage('/p/jihak/jihak-u1/jihak-u1-s1/jihak-u1-s1-l1')
    expect(screen.getByText('이 차시 퀴즈 풀기')).toHaveAttribute(
      'href',
      '/quiz/lesson/jihak-u1-s1-l1',
    )
  })
})
```

Run: `npm test` → FAIL 확인 (`src/pages/LessonDetailPage.jsx` 없음)

- [ ] **Step 4: src/pages/LessonDetailPage.jsx 구현**

```jsx
import { useParams, Link } from 'react-router-dom'
import { getUnit, getSubunit, getLesson, getPublishers, getTopicsForLesson } from '../lib/dataLoader.js'
import UnitBreadcrumb from '../components/UnitBreadcrumb.jsx'
import ResourceCard from '../components/ResourceCard.jsx'

export default function LessonDetailPage() {
  const { publisherId, unitId, subunitId, lessonId } = useParams()
  const publisher = getPublishers().find((p) => p.id === publisherId)
  const unit = getUnit(publisherId, unitId)
  const subunit = getSubunit(publisherId, unitId, subunitId)
  const lesson = getLesson(publisherId, unitId, subunitId, lessonId)
  const topics = getTopicsForLesson(publisherId, lessonId)

  return (
    <main>
      <UnitBreadcrumb
        trail={[
          { href: `/p/${publisherId}`, label: publisher ? publisher.name : publisherId },
          { href: `/p/${publisherId}/${unitId}`, label: unit ? unit.title : unitId },
          { href: `/p/${publisherId}/${unitId}/${subunitId}`, label: subunit ? subunit.title : subunitId },
        ]}
        current={lesson ? lesson.title : lessonId}
      />
      <h1>{lesson ? lesson.title : lessonId}</h1>

      {topics.length === 0 && <p className="empty-state">아직 연결된 서천 지역화 자료가 없어요.</p>}

      {topics.map((topic) => (
        <section key={topic.id} className="topic-block">
          <h2>{topic.차시제목}</h2>
          <p className="topic-usage">{topic.활용법 || '활용 방법을 준비 중입니다.'}</p>
          {topic.resources.length === 0 ? (
            <p className="empty-state">자료 준비 중입니다.</p>
          ) : (
            <div className="resource-list">
              {topic.resources.map((resource, index) => (
                <ResourceCard key={`${topic.id}-${index}`} resource={resource} />
              ))}
            </div>
          )}
        </section>
      ))}

      <Link to={`/quiz/lesson/${lessonId}`} className="quiz-link">
        이 차시 퀴즈 풀기
      </Link>
    </main>
  )
}
```

Run: `npm test` → PASS 확인

- [ ] **Step 5: src/App.jsx에 라우트 추가**

`LessonListPage` 라우트 아래에 추가:

```jsx
          <Route
            path="/p/:publisherId/:unitId/:subunitId/:lessonId"
            element={<LessonDetailPage />}
          />
```

import 추가: `import LessonDetailPage from './pages/LessonDetailPage.jsx'`

- [ ] **Step 6: src/styles/theme.css에 자료 카드 스타일 추가**

```css
.topic-block {
  background: #fffaf3;
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 16px;
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

.quiz-link {
  display: inline-block;
  margin-top: 16px;
  background: var(--color-accent);
  color: white;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 700;
}
```

- [ ] **Step 7: 전체 테스트 확인 후 커밋**

Run: `npm test` → PASS (전체 테스트)

```bash
git add src/components/ResourceCard.jsx src/components/ResourceCard.test.jsx src/pages/LessonDetailPage.jsx src/pages/LessonDetailPage.test.jsx src/App.jsx src/styles/theme.css
git commit -m "feat: add lesson detail page with resource cards"
```

---

## Task 11: 퀴즈 자리 예약 (차시/소단원/대단원 집계)

**Files:**
- Create: `src/components/QuizPlaceholder.jsx`
- Test: `src/components/QuizPlaceholder.test.jsx`
- Create: `src/pages/QuizPage.jsx`
- Test: `src/pages/QuizPage.test.jsx`
- Modify: `src/App.jsx` (라우트 1개 추가)

**Interfaces:**
- Consumes: `getQuizQuestions(scope, refId)`(`src/lib/dataLoader.js`)
- Produces: `QuizPlaceholder`(default export, props: `scope`, `questionCount`)

- [ ] **Step 1: 실패하는 테스트 작성 (src/components/QuizPlaceholder.test.jsx)**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import QuizPlaceholder from './QuizPlaceholder.jsx'

describe('QuizPlaceholder', () => {
  it('scope에 맞는 안내 문구와 문항 수를 보여준다', () => {
    render(<QuizPlaceholder scope="unit" questionCount={0} />)
    expect(screen.getByText('이 대단원 퀴즈는 준비 중이에요.')).toBeInTheDocument()
    expect(screen.getByText('현재 등록된 문항 수: 0개')).toBeInTheDocument()
  })

  it('소단원 scope는 소단원으로 표시한다', () => {
    render(<QuizPlaceholder scope="subunit" questionCount={2} />)
    expect(screen.getByText('이 소단원 퀴즈는 준비 중이에요.')).toBeInTheDocument()
  })
})
```

Run: `npm test` → FAIL 확인

- [ ] **Step 2: src/components/QuizPlaceholder.jsx 구현**

```jsx
const SCOPE_LABELS = {
  lesson: '차시',
  subunit: '소단원',
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

Run: `npm test` → PASS 확인

- [ ] **Step 3: 실패하는 테스트 작성 (src/pages/QuizPage.test.jsx)**

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
  it('문항이 없으면 준비 중 안내를 보여준다', () => {
    renderPage('/quiz/lesson/jihak-u1-s1-l1')
    expect(screen.getByText('이 차시 퀴즈는 준비 중이에요.')).toBeInTheDocument()
  })
})
```

Run: `npm test` → FAIL 확인 (`src/pages/QuizPage.jsx` 없음)

- [ ] **Step 4: src/pages/QuizPage.jsx 구현**

```jsx
import { useParams } from 'react-router-dom'
import { getQuizQuestions } from '../lib/dataLoader.js'
import QuizPlaceholder from '../components/QuizPlaceholder.jsx'

export default function QuizPage() {
  const { scope, refId } = useParams()
  const questions = getQuizQuestions(scope, refId)

  return (
    <main>
      <h1>퀴즈</h1>
      {questions.length === 0 ? (
        <QuizPlaceholder scope={scope} questionCount={0} />
      ) : (
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

Run: `npm test` → PASS 확인

- [ ] **Step 5: src/App.jsx에 라우트 추가**

`ProtectedRoute` 블록 안에 추가:

```jsx
          <Route path="/quiz/:scope/:refId" element={<QuizPage />} />
```

import 추가: `import QuizPage from './pages/QuizPage.jsx'`

- [ ] **Step 6: 전체 테스트 확인 후 커밋**

Run: `npm test` → PASS (전체 테스트)

```bash
git add src/components/QuizPlaceholder.jsx src/components/QuizPlaceholder.test.jsx src/pages/QuizPage.jsx src/pages/QuizPage.test.jsx src/App.jsx
git commit -m "feat: reserve quiz routes with lesson/subunit/unit aggregation"
```

---

## Task 12: 관리자 로그인 & 대시보드

**Files:**
- Modify: `src/pages/AdminLoginPage.jsx` (Task 7의 스텁을 실제 구현으로 교체)
- Test: `src/pages/AdminLoginPage.test.jsx`
- Modify: `src/pages/AdminDashboardPage.jsx` (Task 7의 스텁을 실제 구현으로 교체)
- Test: `src/pages/AdminDashboardPage.test.jsx`

**Interfaces:**
- Consumes: `auth`(`src/firebase.js`), `signInWithEmailAndPassword`/`signOut`(firebase/auth)

- [ ] **Step 1: 실패하는 테스트 작성 (src/pages/AdminLoginPage.test.jsx)**

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AdminLoginPage from './AdminLoginPage.jsx'
import { signInWithEmailAndPassword } from 'firebase/auth'

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  getAuth: vi.fn(() => ({})),
}))
vi.mock('../firebase.js', () => ({ auth: {} }))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AdminLoginPage', () => {
  it('로그인 실패 시 에러 메시지를 보여준다', async () => {
    signInWithEmailAndPassword.mockRejectedValue(new Error('bad credentials'))
    render(
      <MemoryRouter>
        <AdminLoginPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('로그인에 실패했어요')
    })
  })
})
```

Run: `npm test` → FAIL 확인 (스텁 페이지에는 폼이 없음)

- [ ] **Step 2: src/pages/AdminLoginPage.jsx를 실제 구현으로 교체**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase.js'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin')
    } catch {
      setError('로그인에 실패했어요. 이메일과 비밀번호를 확인해 주세요.')
    }
  }

  return (
    <main className="admin-login-page">
      <h1>관리자 로그인</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="admin-email">이메일</label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
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

Run: `npm test` → PASS 확인

- [ ] **Step 3: 실패하는 테스트 작성 (src/pages/AdminDashboardPage.test.jsx)**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AdminDashboardPage from './AdminDashboardPage.jsx'

vi.mock('firebase/auth', () => ({ signOut: vi.fn() }))
vi.mock('../firebase.js', () => ({ auth: {} }))

describe('AdminDashboardPage', () => {
  it('비밀번호는 Firebase 콘솔에서 관리한다는 안내를 보여준다', () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Firebase 콘솔에서 직접 관리합니다/)).toBeInTheDocument()
  })
})
```

Run: `npm test` → FAIL 확인

- [ ] **Step 4: src/pages/AdminDashboardPage.jsx를 실제 구현으로 교체**

```jsx
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase.js'

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut(auth)
    navigate('/admin/login')
  }

  return (
    <main className="admin-dashboard-page">
      <h1>관리자 대시보드</h1>
      <p>
        교사/학생 비밀번호와 관리자 계정 비밀번호는 Firebase 콘솔에서 직접 관리합니다. 콘텐츠(JSON
        데이터)는 저장소 코드로 직접 관리합니다.
      </p>
      <button type="button" onClick={handleSignOut}>
        로그아웃
      </button>
    </main>
  )
}
```

Run: `npm test` → PASS 확인

- [ ] **Step 5: 커밋**

```bash
git add src/pages/AdminLoginPage.jsx src/pages/AdminLoginPage.test.jsx src/pages/AdminDashboardPage.jsx src/pages/AdminDashboardPage.test.jsx
git commit -m "feat: implement admin login and minimal dashboard"
```

---

## Task 13: GitHub Pages 배포

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md` (배포 섹션 추가)

**Interfaces:**
- 없음 (CI/CD 설정)

- [ ] **Step 1: .github/workflows/deploy.yml 작성**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

이 저장소의 기본 브랜치가 `main`이 아니라면(`git branch --show-current`로 확인) `on.push.branches` 값을 실제 기본 브랜치 이름으로 맞춘다.

- [ ] **Step 2: README.md에 배포 섹션 추가**

```markdown
## GitHub Pages 배포

1. GitHub에 새 저장소 생성 (예: `seocheon-sahoe`)
2. 저장소 Settings → Pages → Build and deployment → Source를 "GitHub Actions"로 설정
3. 저장소 Settings → Secrets and variables → Actions에 `.env.example`과 동일한 이름으로 Firebase 설정값 6개를 Repository secret으로 등록
4. `vite.config.js`의 `base` 값이 저장소 이름과 일치하는지 확인 (`/저장소이름/`)
5. `main` 브랜치에 푸시하면 GitHub Actions가 자동으로 테스트 → 빌드 → 배포를 실행한다
6. 배포된 사이트 주소: `https://<github-사용자명>.github.io/seocheon-sahoe/`
```

- [ ] **Step 3: 로컬에서 빌드가 통과하는지 최종 확인**

Run: `npm test && npm run build`
Expected: 테스트 전체 PASS, `dist/` 폴더 생성 성공

- [ ] **Step 4: 커밋**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "ci: add GitHub Pages deployment workflow"
```

(GitHub 원격 저장소 생성, secrets 등록, 실제 푸시는 사용자가 GitHub 저장소를 만든 뒤 직접 진행 — 이 단계는 이번 플랜 실행 범위 밖이며 위 README 안내를 따른다.)
