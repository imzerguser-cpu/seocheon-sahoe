# 관리자 자료·퀴즈 관리 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 브라우저에서 차시별로 서천 지역화 자료(사진·영상 링크·QR)를 첨부하고 퀴즈(객관식/OX/단답식)를 만들고 수정할 수 있게 하며, 학생 화면에서 그 자료·퀴즈를 실제로 보고 풀 수 있게 한다.

**Architecture:** 콘텐츠 저장용으로 Firestore를 재도입한다(인증용 Firebase는 여전히 제거된 상태 — 이번에 추가하는 인증은 전체관리자 1계정 전용). `materials`/`quizzes` 컬렉션은 읽기·쓰기 모두 공개, `adminConfig` 문서만 Firebase 인증(전체관리자)이 있어야 쓸 수 있다. 학교관리자(비밀번호)와 전체관리자(Firebase 실명 로그인) 2단계 관리자를 만든다.

**Tech Stack:** React 18, Vite 5, react-router-dom 6(HashRouter), Vitest + @testing-library/react, Firebase(Firestore + Auth, 이번에 부분 재도입), `qrcode.react`(QR 이미지 생성).

## Global Constraints

- 참조 스펙: `docs/superpowers/specs/2026-08-07-admin-content-management-design.md`
- 학생/학교 로그인(스쿨 JSON 비교)은 이번 변경과 완전히 무관하며 절대 건드리지 않는다.
- 교육과정(대단원/학습주제/차시) 데이터는 지금처럼 정적 JSON으로 유지한다 — Firestore로 옮기지 않는다.
- `materials`, `quizzes` Firestore 컬렉션은 읽기·쓰기 모두 공개(`allow read, write: if true`) — 이번 단계에서 의도적으로 잠그지 않는다(재논의 대상 아님).
- `adminConfig` 문서는 읽기는 공개, 쓰기는 `request.auth != null`(=전체관리자로 로그인한 사람)만 가능하다.
- 학교관리자: 단순 비밀번호 로그인(현재 `20262026`과 같은 값, Firestore `adminConfig` 문서와 비교). 자료 관리·퀴즈 관리 가능. 학교관리자 비밀번호는 바꿀 수 없다.
- 전체관리자: Firebase 이메일/비밀번호 로그인, 계정 1개(Firebase 콘솔에서 수동 생성). 학교관리자가 하는 모든 것 + 학교관리자 비밀번호 변경 가능.
- QR 자료는 관리자가 목적지 URL만 입력하면 학생 화면에서 그 자리에 QR 이미지를 자동 생성해서 보여준다(이미지 파일 업로드 없음).
- 사진 자료도 파일 업로드가 아니라 이미 어딘가에 있는 이미지의 링크(URL)만 입력받는다.
- 차시 상세 페이지의 자료 섹션·퀴즈 링크는 실제로 연결된 자료·문제가 있을 때만 보인다(빈 차시에 빈 칸을 만들지 않는다).
- 학생이 퀴즈를 풀면 그 자리에서만 채점하고, 점수나 풀이 이력은 저장하지 않는다.
- 기존 `src/data/topics.json`/`src/data/mappings.json`의 6개 테스트용 자리표시자는 폐기한다. `src/data/quizzes.json`(현재 빈 배열)도 더 이상 쓰지 않는다.

---

## Task 1: Firebase 재도입 (Firestore + Auth 초기화)

**Files:**
- Create: `src/firebase.js`
- Create: `.env.example`
- Modify: `package.json` (firebase, qrcode.react 의존성 추가)
- Modify: `.github/workflows/deploy.yml` (Firebase 시크릿 env 추가)
- Modify: `README.md` (Firebase 프로젝트 설정 안내 추가)

**Interfaces:**
- Produces (named export, `src/firebase.js`): `db`(Firestore 인스턴스), `auth`(Firebase Auth 인스턴스)

이 태스크는 순수 설정/설치 작업이라 TDD 대상이 아니다(테스트할 로직이 없음). 빌드가 깨지지 않는지만 확인한다.

- [ ] **Step 1: firebase, qrcode.react 패키지 설치**

```bash
cd "C:\Users\박정민\seocheon-sahoe"
npm install firebase@^11.0.0 qrcode.react@^3.1.0
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

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
```

- [ ] **Step 3: .env.example 작성**

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

- [ ] **Step 4: package.json에 의존성 반영 확인**

`npm install` 실행 시 `dependencies`에 다음 두 줄이 추가되어 있어야 한다(정확한 버전은 설치 시점의 latest-within-range로 npm이 채움):

```json
    "firebase": "^11.0.0",
    "qrcode.react": "^3.1.0",
```

- [ ] **Step 5: .github/workflows/deploy.yml의 build 스텝에 Firebase 시크릿 env 추가**

`- run: npm run build` 스텝을 다음으로 교체한다(다른 스텝은 그대로 둔다):

```yaml
      - run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
```

- [ ] **Step 6: README.md에 Firebase 프로젝트 설정 섹션 추가**

"개발 환경 실행" 섹션 앞에 다음 섹션을 추가한다:

```markdown
## Firebase 프로젝트 설정 (최초 1회)

이번 단계부터 관리자가 올리는 자료·퀴즈를 저장하기 위해 Firestore를 사용합니다.

1. https://console.firebase.google.com 에서 프로젝트를 새로 만들거나 기존 프로젝트를 연다.
2. Firestore Database를 프로덕션 모드로 생성한다.
3. Authentication → 로그인 방법 → "이메일/비밀번호" 사용 설정 → 사용자 탭에서 전체관리자 계정 1개를 수동으로 생성한다(이메일/비밀번호는 직접 정한다).
4. 프로젝트 설정 → 내 앱 → 웹 앱 추가 → 표시된 설정값을 `.env.local`에 복사한다(`.env.example` 참고).
5. GitHub 저장소 Settings → Secrets and variables → Actions에도 같은 이름으로 6개 값을 Repository secret으로 등록한다(배포 시 필요).
6. Firestore 보안 규칙은 `firestore.rules` 파일 내용을 Firebase 콘솔의 Firestore → 규칙 탭에 붙여넣고 게시한다.
7. 전체관리자 비밀번호를 바꾸려면 Authentication 콘솔에서 직접 재설정한다(사이트 내 비밀번호 찾기 기능 없음).
```

- [ ] **Step 7: 개발 환경 실행 섹션에 .env.local 복사 단계 추가**

기존 "개발 환경 실행" 섹션을:

```markdown
## 개발 환경 실행

```bash
npm install
npm run dev
```
```

다음으로 교체한다:

```markdown
## 개발 환경 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev
```
```

- [ ] **Step 8: 빌드 확인**

`.env.local`이 없는 상태에서도 빌드는 성공해야 한다(런타임에 Firestore 연결이 안 될 뿐, 빌드 자체는 `import.meta.env.VITE_*`가 `undefined`여도 통과한다):

```bash
npm run build
```
Expected: 성공

- [ ] **Step 9: 커밋**

```bash
git add src/firebase.js .env.example package.json package-lock.json .github/workflows/deploy.yml README.md
git commit -m "feat: reintroduce Firebase for Firestore-backed content storage"
```

---

## Task 2: auth.js에 2단계 관리자(학교관리자/전체관리자) 로직 추가

**Files:**
- Modify: `src/lib/auth.js`
- Modify: `src/lib/auth.test.js`

**Interfaces:**
- Produces (named export, `src/lib/auth.js`):
  - `saveAdminSession(role)` — `role: 'school-admin' | 'super-admin'`
  - `getAdminSession() -> 'school-admin' | 'super-admin' | null`
  - `clearAdminSession()` (기존과 동일)
  - `matchAdminPassword(adminConfig, inputPassword) -> boolean` (기존과 동일한 시그니처, 호출부만 나중에 Firestore 조회 결과를 넘기도록 바뀜)
  - `signInSuperAdmin(email, password) -> Promise<boolean>`
  - `signOutSuperAdmin() -> Promise<void>`
- Consumes: `auth`(`src/firebase.js`), `signInWithEmailAndPassword`/`signOut`(`firebase/auth`)

이전 버전의 `saveAdminSession()`/`getAdminSession()`은 인자 없이 boolean만 다뤘다. 이번 태스크에서 역할(role) 문자열을 저장·반환하도록 바꾼다. `AdminRoute.jsx`의 `if (!getAdminSession())` 조건은 `null`이 falsy이므로 코드 수정 없이 그대로 동작하지만, 이 파일을 사용하는 페이지들은 Task 3~4에서 새 반환값에 맞춰 다시 쓴다.

- [ ] **Step 1: 실패하는 테스트로 src/lib/auth.test.js 확장**

기존 테스트 파일 상단 import에 다음을 추가한다:

```js
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

vi.mock('../firebase.js', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}))
```

기존 `describe('admin session storage', ...)` 블록 전체를 다음으로 교체한다(boolean이 아니라 role 문자열을 다루도록):

```js
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
```

파일 맨 아래에 다음을 추가한다:

```js
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
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npx vitest run src/lib/auth.test.js`
Expected: FAIL — `signInSuperAdmin`/`signOutSuperAdmin`이 아직 export되지 않고, `saveAdminSession('school-admin')` 뒤 `getAdminSession()`이 여전히 `true`/`false`만 반환함

- [ ] **Step 3: src/lib/auth.js 전체 교체**

```js
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../firebase.js'

const SESSION_KEY = 'seocheon-sahoe:session'
const ADMIN_SESSION_KEY = 'seocheon-sahoe:admin-session'
const ADMIN_ROLES = ['school-admin', 'super-admin']

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

export function saveAdminSession(role) {
  localStorage.setItem(ADMIN_SESSION_KEY, role)
}

export function getAdminSession() {
  const role = localStorage.getItem(ADMIN_SESSION_KEY)
  return ADMIN_ROLES.includes(role) ? role : null
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

export async function signInSuperAdmin(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password)
    return true
  } catch {
    return false
  }
}

export async function signOutSuperAdmin() {
  await signOut(auth)
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/lib/auth.test.js`
Expected: PASS (전체 테스트)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/auth.js src/lib/auth.test.js
git commit -m "feat: add school-admin/super-admin roles and Firebase super-admin sign-in"
```

---

## Task 3: adminConfig Firestore 이관 + 로그인 화면 2탭(학교관리자/전체관리자) 개편

**Files:**
- Create: `src/lib/adminConfigRepo.js`
- Create: `src/lib/adminConfigRepo.test.js`
- Delete: `src/data/adminConfig.json`
- Modify: `src/pages/AdminLoginPage.jsx`
- Modify: `src/pages/AdminLoginPage.test.jsx`

**Interfaces:**
- Produces (named export, `src/lib/adminConfigRepo.js`):
  - `fetchAdminConfig() -> Promise<{password: string} | null>`
  - `updateAdminPassword(newPassword) -> Promise<void>`
- Consumes: `db`(`src/firebase.js`), `matchAdminPassword`/`saveAdminSession`/`signInSuperAdmin`(`src/lib/auth.js`)

- [ ] **Step 1: 실패하는 테스트로 src/lib/adminConfigRepo.test.js 작성**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { fetchAdminConfig, updateAdminPassword } from './adminConfigRepo.js'

vi.mock('../firebase.js', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...args) => args),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchAdminConfig', () => {
  it('문서가 있으면 데이터를 반환한다', async () => {
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ password: '20262026' }) })
    const result = await fetchAdminConfig()
    expect(result).toEqual({ password: '20262026' })
    expect(doc).toHaveBeenCalledWith({}, 'adminConfig', 'main')
  })

  it('문서가 없으면 null을 반환한다', async () => {
    getDoc.mockResolvedValue({ exists: () => false })
    const result = await fetchAdminConfig()
    expect(result).toBeNull()
  })
})

describe('updateAdminPassword', () => {
  it('새 비밀번호로 문서를 덮어쓴다', async () => {
    setDoc.mockResolvedValue()
    await updateAdminPassword('1234')
    expect(setDoc).toHaveBeenCalledWith({}, 'adminConfig', 'main', { password: '1234' })
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npx vitest run src/lib/adminConfigRepo.test.js`
Expected: FAIL — `src/lib/adminConfigRepo.js` 없음

- [ ] **Step 3: src/lib/adminConfigRepo.js 작성**

```js
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

export async function fetchAdminConfig() {
  const snap = await getDoc(doc(db, 'adminConfig', 'main'))
  return snap.exists() ? snap.data() : null
}

export async function updateAdminPassword(newPassword) {
  await setDoc(doc(db, 'adminConfig', 'main'), { password: newPassword })
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/lib/adminConfigRepo.test.js`
Expected: PASS (3 tests)

- [ ] **Step 5: src/data/adminConfig.json 삭제**

```bash
rm src/data/adminConfig.json
```

- [ ] **Step 6: 실패하는 테스트로 src/pages/AdminLoginPage.test.jsx 전체 교체**

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminLoginPage from './AdminLoginPage.jsx'

vi.mock('../lib/adminConfigRepo.js', () => ({
  fetchAdminConfig: vi.fn(),
}))
vi.mock('../lib/auth.js', () => ({
  matchAdminPassword: vi.fn((config, input) => !!config && input === config.password),
  saveAdminSession: vi.fn(),
  signInSuperAdmin: vi.fn(),
}))

import { fetchAdminConfig } from '../lib/adminConfigRepo.js'
import { saveAdminSession, signInSuperAdmin } from '../lib/auth.js'

beforeEach(() => {
  vi.clearAllMocks()
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
  it('기본값은 학교관리자 탭이고 비밀번호 입력만 보인다', () => {
    renderPage()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.queryByLabelText('이메일')).not.toBeInTheDocument()
  })

  it('학교관리자: 올바른 비밀번호면 학교관리자 세션이 저장되고 대시보드로 이동한다', async () => {
    fetchAdminConfig.mockResolvedValue({ password: '20262026' })
    renderPage()

    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '20262026' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => expect(screen.getByText('관리자 대시보드 페이지')).toBeInTheDocument())
    expect(saveAdminSession).toHaveBeenCalledWith('school-admin')
  })

  it('학교관리자: 틀린 비밀번호면 에러를 보여준다', async () => {
    fetchAdminConfig.mockResolvedValue({ password: '20262026' })
    renderPage()

    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('비밀번호가 올바르지 않아요'),
    )
    expect(saveAdminSession).not.toHaveBeenCalled()
  })

  it('전체관리자 탭을 누르면 이메일/비밀번호 입력으로 바뀐다', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '전체관리자' }))
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
  })

  it('전체관리자: 로그인 성공하면 super-admin 세션이 저장되고 대시보드로 이동한다', async () => {
    signInSuperAdmin.mockResolvedValue(true)
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: '전체관리자' }))
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'pw123456' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => expect(screen.getByText('관리자 대시보드 페이지')).toBeInTheDocument())
    expect(saveAdminSession).toHaveBeenCalledWith('super-admin')
  })

  it('전체관리자: 로그인 실패하면 에러를 보여준다', async () => {
    signInSuperAdmin.mockResolvedValue(false)
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: '전체관리자' }))
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('로그인에 실패했어요'),
    )
  })
})
```

- [ ] **Step 7: 테스트 실행해 실패 확인**

Run: `npx vitest run src/pages/AdminLoginPage.test.jsx`
Expected: FAIL — 현재 `AdminLoginPage`는 탭이 없고 정적 `adminConfig.json`을 동기적으로 비교함

- [ ] **Step 8: src/pages/AdminLoginPage.jsx 전체 교체**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAdminConfig } from '../lib/adminConfigRepo.js'
import { matchAdminPassword, saveAdminSession, signInSuperAdmin } from '../lib/auth.js'

export default function AdminLoginPage() {
  const [tab, setTab] = useState('school')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  function switchTab(nextTab) {
    setTab(nextTab)
    setError('')
    setPassword('')
    setEmail('')
  }

  async function handleSchoolSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const adminConfig = await fetchAdminConfig()
    setSubmitting(false)
    if (!matchAdminPassword(adminConfig, password)) {
      setError('비밀번호가 올바르지 않아요. 다시 확인해 주세요.')
      return
    }
    saveAdminSession('school-admin')
    navigate('/admin')
  }

  async function handleSuperSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const success = await signInSuperAdmin(email, password)
    setSubmitting(false)
    if (!success) {
      setError('로그인에 실패했어요. 이메일과 비밀번호를 확인해 주세요.')
      return
    }
    saveAdminSession('super-admin')
    navigate('/admin')
  }

  return (
    <main className="admin-login-page">
      <h1>관리자 로그인</h1>
      <div className="admin-login-tabs">
        <button
          type="button"
          className={tab === 'school' ? 'active' : ''}
          onClick={() => switchTab('school')}
        >
          학교관리자
        </button>
        <button
          type="button"
          className={tab === 'super' ? 'active' : ''}
          onClick={() => switchTab('super')}
        >
          전체관리자
        </button>
      </div>

      {tab === 'school' && (
        <form onSubmit={handleSchoolSubmit}>
          <label htmlFor="admin-password">비밀번호</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={submitting}>
            로그인
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}

      {tab === 'super' && (
        <form onSubmit={handleSuperSubmit}>
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
          <button type="submit" disabled={submitting}>
            로그인
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
    </main>
  )
}
```

- [ ] **Step 9: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/pages/AdminLoginPage.test.jsx`
Expected: PASS (6 tests)

- [ ] **Step 10: 커밋**

```bash
git add src/lib/adminConfigRepo.js src/lib/adminConfigRepo.test.js src/pages/AdminLoginPage.jsx src/pages/AdminLoginPage.test.jsx
git rm src/data/adminConfig.json
git commit -m "feat: move adminConfig to Firestore, add two-tab admin login"
```

---

## Task 4: SuperAdminRoute + 관리자 대시보드 메뉴 확장

**Files:**
- Create: `src/components/SuperAdminRoute.jsx`
- Create: `src/components/SuperAdminRoute.test.jsx`
- Modify: `src/pages/AdminDashboardPage.jsx`
- Modify: `src/pages/AdminDashboardPage.test.jsx`

**Interfaces:**
- Consumes: `getAdminSession`, `clearAdminSession`, `signOutSuperAdmin`(`src/lib/auth.js`)
- Produces: `SuperAdminRoute`(default export) — `getAdminSession()`이 `'super-admin'`이 아니면 `/admin/login`으로 리다이렉트, 맞으면 `<Outlet />` 렌더링

`AdminRoute.jsx`는 이미 `if (!getAdminSession())`로 세션 유무만 검사하므로, `getAdminSession()`이 문자열을 반환하도록 바뀌어도 `!'school-admin'`과 `!'super-admin'` 모두 `false`라 수정 없이 그대로 두 관리자 모두를 통과시킨다. 이 태스크에서는 `SuperAdminRoute`만 새로 만든다.

- [ ] **Step 1: 실패하는 테스트로 src/components/SuperAdminRoute.test.jsx 작성**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SuperAdminRoute from './SuperAdminRoute.jsx'
import { saveAdminSession } from '../lib/auth.js'

beforeEach(() => {
  localStorage.clear()
})

function renderWithSession() {
  return render(
    <MemoryRouter initialEntries={['/admin/password']}>
      <Routes>
        <Route element={<SuperAdminRoute />}>
          <Route path="/admin/password" element={<div>비밀번호 변경 페이지</div>} />
        </Route>
        <Route path="/admin/login" element={<div>관리자 로그인 페이지</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SuperAdminRoute', () => {
  it('전체관리자 세션이면 자식 라우트를 보여준다', () => {
    saveAdminSession('super-admin')
    renderWithSession()
    expect(screen.getByText('비밀번호 변경 페이지')).toBeInTheDocument()
  })

  it('학교관리자 세션이면 관리자 로그인 페이지로 보낸다', () => {
    saveAdminSession('school-admin')
    renderWithSession()
    expect(screen.getByText('관리자 로그인 페이지')).toBeInTheDocument()
  })

  it('세션이 없으면 관리자 로그인 페이지로 보낸다', () => {
    renderWithSession()
    expect(screen.getByText('관리자 로그인 페이지')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npx vitest run src/components/SuperAdminRoute.test.jsx`
Expected: FAIL — `src/components/SuperAdminRoute.jsx` 없음

- [ ] **Step 3: src/components/SuperAdminRoute.jsx 작성**

```jsx
import { Navigate, Outlet } from 'react-router-dom'
import { getAdminSession } from '../lib/auth.js'

export default function SuperAdminRoute() {
  if (getAdminSession() !== 'super-admin') return <Navigate to="/admin/login" replace />
  return <Outlet />
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/components/SuperAdminRoute.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 5: 실패하는 테스트로 src/pages/AdminDashboardPage.test.jsx 전체 교체**

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminDashboardPage from './AdminDashboardPage.jsx'

vi.mock('../firebase.js', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn().mockResolvedValue(),
}))

// auth.js itself is NOT mocked — saveAdminSession/getAdminSession/clearAdminSession
// run for real against localStorage. Only its Firebase dependency is mocked above,
// so signOutSuperAdmin() also runs for real and calls the mocked firebase/auth signOut.
import { saveAdminSession, getAdminSession } from '../lib/auth.js'
import { signOut } from 'firebase/auth'

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
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
  it('자료 관리, 퀴즈 관리 링크를 보여준다', () => {
    saveAdminSession('school-admin')
    renderPage()
    expect(screen.getByRole('link', { name: '자료 관리' })).toHaveAttribute(
      'href',
      '/admin/materials',
    )
    expect(screen.getByRole('link', { name: '퀴즈 관리' })).toHaveAttribute(
      'href',
      '/admin/quizzes',
    )
  })

  it('학교관리자로 로그인하면 비밀번호 변경 링크가 안 보인다', () => {
    saveAdminSession('school-admin')
    renderPage()
    expect(screen.queryByRole('link', { name: '학교관리자 비밀번호 변경' })).not.toBeInTheDocument()
  })

  it('전체관리자로 로그인하면 비밀번호 변경 링크가 보인다', () => {
    saveAdminSession('super-admin')
    renderPage()
    expect(screen.getByRole('link', { name: '학교관리자 비밀번호 변경' })).toHaveAttribute(
      'href',
      '/admin/password',
    )
  })

  it('로그아웃 버튼을 누르면 세션이 지워지고 로그인 페이지로 이동한다', () => {
    saveAdminSession('school-admin')
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(screen.getByText('관리자 로그인 페이지')).toBeInTheDocument()
    expect(getAdminSession()).toBeNull()
  })

  it('전체관리자로 로그아웃하면 Firebase signOut도 호출한다', () => {
    saveAdminSession('super-admin')
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(signOut).toHaveBeenCalled()
  })
})
```

- [ ] **Step 6: 테스트 실행해 실패 확인**

Run: `npx vitest run src/pages/AdminDashboardPage.test.jsx`
Expected: FAIL — 현재 페이지는 안내 문구와 로그아웃 버튼만 있고 메뉴 링크가 없음

- [ ] **Step 7: src/pages/AdminDashboardPage.jsx 전체 교체**

```jsx
import { Link, useNavigate } from 'react-router-dom'
import { clearAdminSession, getAdminSession, signOutSuperAdmin } from '../lib/auth.js'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const role = getAdminSession()

  async function handleSignOut() {
    if (role === 'super-admin') {
      await signOutSuperAdmin()
    }
    clearAdminSession()
    navigate('/admin/login')
  }

  return (
    <main className="admin-dashboard-page">
      <h1>관리자 대시보드</h1>
      <nav className="admin-menu">
        <Link to="/admin/materials">자료 관리</Link>
        <Link to="/admin/quizzes">퀴즈 관리</Link>
        {role === 'super-admin' && <Link to="/admin/password">학교관리자 비밀번호 변경</Link>}
      </nav>
      <button type="button" onClick={handleSignOut}>
        로그아웃
      </button>
    </main>
  )
}
```

- [ ] **Step 8: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/pages/AdminDashboardPage.test.jsx`
Expected: PASS (5 tests)

- [ ] **Step 9: 커밋**

```bash
git add src/components/SuperAdminRoute.jsx src/components/SuperAdminRoute.test.jsx src/pages/AdminDashboardPage.jsx src/pages/AdminDashboardPage.test.jsx
git commit -m "feat: add SuperAdminRoute and expand admin dashboard menu"
```

---

## Task 5: 학교관리자 비밀번호 변경 페이지 (전체관리자 전용)

**Files:**
- Create: `src/pages/AdminPasswordPage.jsx`
- Create: `src/pages/AdminPasswordPage.test.jsx`

**Interfaces:**
- Consumes: `updateAdminPassword`(`src/lib/adminConfigRepo.js`)

- [ ] **Step 1: 실패하는 테스트로 src/pages/AdminPasswordPage.test.jsx 작성**

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AdminPasswordPage from './AdminPasswordPage.jsx'

vi.mock('../lib/adminConfigRepo.js', () => ({
  updateAdminPassword: vi.fn(),
}))

import { updateAdminPassword } from '../lib/adminConfigRepo.js'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AdminPasswordPage', () => {
  it('새 비밀번호 입력창과 저장 버튼을 보여준다', () => {
    render(<AdminPasswordPage />)
    expect(screen.getByLabelText('새 비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })

  it('입력값이 비어있으면 저장 버튼이 비활성화된다', () => {
    render(<AdminPasswordPage />)
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
  })

  it('제출하면 새 비밀번호로 updateAdminPassword를 호출하고 완료 메시지를 보여준다', async () => {
    updateAdminPassword.mockResolvedValue()
    render(<AdminPasswordPage />)

    fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: '3333' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(updateAdminPassword).toHaveBeenCalledWith('3333')
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('학교관리자 비밀번호가 변경되었어요'),
    )
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npx vitest run src/pages/AdminPasswordPage.test.jsx`
Expected: FAIL — `src/pages/AdminPasswordPage.jsx` 없음

- [ ] **Step 3: src/pages/AdminPasswordPage.jsx 작성**

```jsx
import { useState } from 'react'
import { updateAdminPassword } from '../lib/adminConfigRepo.js'

export default function AdminPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    await updateAdminPassword(newPassword)
    setSubmitting(false)
    setStatus('학교관리자 비밀번호가 변경되었어요.')
    setNewPassword('')
  }

  return (
    <main className="admin-password-page">
      <h1>학교관리자 비밀번호 변경</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="new-password">새 비밀번호</label>
        <input
          id="new-password"
          type="text"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button type="submit" disabled={submitting || !newPassword}>
          저장
        </button>
      </form>
      {status && <p role="status">{status}</p>}
    </main>
  )
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/pages/AdminPasswordPage.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/pages/AdminPasswordPage.jsx src/pages/AdminPasswordPage.test.jsx
git commit -m "feat: add super-admin-only page to change the school-admin password"
```

---

## Task 6: materialsRepo.js (Firestore 자료 CRUD) + dataLoader.js에서 서천자료 로직 제거

**Files:**
- Create: `src/lib/materialsRepo.js`
- Create: `src/lib/materialsRepo.test.js`
- Modify: `src/lib/dataLoader.js`
- Modify: `src/lib/dataLoader.test.js`
- Delete: `src/data/topics.json`, `src/data/mappings.json`

**Interfaces:**
- Produces (named export, `src/lib/materialsRepo.js`):
  - `Material` shape: `{ id, title, usageNote, resources: [{type, title, url}], lessonRefs: [{publisherId, lessonId}] }` (`resources[].type`: `'photo'|'video'|'qr'`)
  - `fetchAllMaterials() -> Promise<Material[]>`
  - `fetchMaterialsForLesson(lessonId) -> Promise<Material[]>` (lessonId는 출판사 접두사가 붙어 전역에서 유일하므로 publisherId는 필요 없음)
  - `createMaterial({title, usageNote, resources, lessonRefs}) -> Promise<string>` (생성된 문서 id 반환)
  - `updateMaterial(materialId, {title, usageNote, resources, lessonRefs}) -> Promise<void>`
  - `deleteMaterial(materialId) -> Promise<void>`
- Consumes: `db`(`src/firebase.js`)

`materials` 문서는 `lessonRefs`(관리자 화면에 그대로 표시되는 원본 데이터) 외에, Firestore의 `array-contains` 쿼리로 "이 차시에 연결된 자료"를 빠르게 찾기 위한 파생 필드 `lessonIds`(문자열 배열, `lessonRefs`에서 자동으로 만들어짐)도 함께 저장한다. `lessonIds`는 관리자가 직접 입력하지 않고 repo 함수가 항상 `lessonRefs`로부터 다시 계산해서 저장하므로 둘이 어긋날 일이 없다.

이 태스크에서 `dataLoader.js`의 책임을 커리큘럼(교육과정) 데이터로만 좁힌다. 서천 지역화 자료 조회는 앞으로 `materialsRepo.js`를 페이지에서 직접 사용한다.

- [ ] **Step 1: 실패하는 테스트로 src/lib/materialsRepo.test.js 작성**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import {
  fetchAllMaterials,
  fetchMaterialsForLesson,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from './materialsRepo.js'

vi.mock('../firebase.js', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...args) => ({ __collection: args })),
  doc: vi.fn((...args) => ({ __doc: args })),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn((...args) => ({ __query: args })),
  where: vi.fn((...args) => ({ __where: args })),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function fakeSnapshot(docs) {
  return { docs: docs.map((d) => ({ id: d.id, data: () => d.data })) }
}

describe('fetchAllMaterials', () => {
  it('컬렉션의 모든 문서를 id와 함께 반환한다', async () => {
    getDocs.mockResolvedValue(
      fakeSnapshot([{ id: 'm1', data: { title: '자료1' } }, { id: 'm2', data: { title: '자료2' } }]),
    )
    const result = await fetchAllMaterials()
    expect(result).toEqual([
      { id: 'm1', title: '자료1' },
      { id: 'm2', title: '자료2' },
    ])
  })
})

describe('fetchMaterialsForLesson', () => {
  it('lessonIds에 해당 차시가 포함된 문서만 array-contains로 조회한다', async () => {
    getDocs.mockResolvedValue(fakeSnapshot([{ id: 'm1', data: { title: '자료1' } }]))
    const result = await fetchMaterialsForLesson('ecrimedia-u1-t5-l1')
    expect(where).toHaveBeenCalledWith('lessonIds', 'array-contains', 'ecrimedia-u1-t5-l1')
    expect(result).toEqual([{ id: 'm1', title: '자료1' }])
  })
})

describe('createMaterial', () => {
  it('lessonRefs로부터 lessonIds를 계산해서 함께 저장한다', async () => {
    addDoc.mockResolvedValue({ id: 'new-id' })
    const id = await createMaterial({
      title: '자료',
      usageNote: '',
      resources: [],
      lessonRefs: [
        { publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t5-l1' },
        { publisherId: 'chunjae-park', lessonId: 'chunjae-park-u1-t6-l1' },
      ],
    })
    expect(id).toBe('new-id')
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: '자료',
        lessonIds: ['ecrimedia-u1-t5-l1', 'chunjae-park-u1-t6-l1'],
      }),
    )
  })
})

describe('updateMaterial', () => {
  it('lessonIds를 다시 계산해서 문서를 갱신한다', async () => {
    updateDoc.mockResolvedValue()
    await updateMaterial('m1', {
      title: '수정된 자료',
      usageNote: '',
      resources: [],
      lessonRefs: [{ publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t5-l1' }],
    })
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ title: '수정된 자료', lessonIds: ['ecrimedia-u1-t5-l1'] }),
    )
  })
})

describe('deleteMaterial', () => {
  it('해당 id의 문서를 삭제한다', async () => {
    deleteDoc.mockResolvedValue()
    await deleteMaterial('m1')
    expect(deleteDoc).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npx vitest run src/lib/materialsRepo.test.js`
Expected: FAIL — `src/lib/materialsRepo.js` 없음

- [ ] **Step 3: src/lib/materialsRepo.js 작성**

```js
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase.js'

const COLLECTION = 'materials'

function toLessonIds(lessonRefs) {
  return lessonRefs.map((ref) => ref.lessonId)
}

export async function fetchAllMaterials() {
  const snap = await getDocs(collection(db, COLLECTION))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function fetchMaterialsForLesson(lessonId) {
  const q = query(collection(db, COLLECTION), where('lessonIds', 'array-contains', lessonId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createMaterial(material) {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...material,
    lessonIds: toLessonIds(material.lessonRefs ?? []),
  })
  return ref.id
}

export async function updateMaterial(materialId, material) {
  await updateDoc(doc(db, COLLECTION, materialId), {
    ...material,
    lessonIds: toLessonIds(material.lessonRefs ?? []),
  })
}

export async function deleteMaterial(materialId) {
  await deleteDoc(doc(db, COLLECTION, materialId))
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/lib/materialsRepo.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: src/lib/dataLoader.js에서 서천자료 관련 코드 제거**

`src/lib/dataLoader.js` 상단 import에서 `topicsData`, `mappingsData` 관련 줄을 삭제하고, `selectSeocheonTopicsForLesson`/`getSeocheonTopicsForLesson` 함수 정의를 통째로 삭제한다. 최종 파일은 다음과 같아야 한다(퀴즈 관련 함수는 Task 8에서 별도로 정리하므로 지금은 그대로 둔다):

```js
import publishersData from '../data/publishers.json'
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

export function getQuizQuestions(scope, refId) {
  return selectQuizQuestions(quizzesData, scope, refId)
}
```

- [ ] **Step 6: src/lib/dataLoader.test.js에서 서천자료 관련 테스트 제거**

`describe('selectSeocheonTopicsForLesson', ...)` 블록 전체와, `describe('실제 데이터에 바인딩된 함수', ...)` 안의 `it('getSeocheonTopicsForLesson은 N:M 매핑을...')` 테스트, 그리고 파일 상단 import 목록의 `selectSeocheonTopicsForLesson`/`getSeocheonTopicsForLesson`를 제거한다. 나머지 테스트(대단원/학습주제/차시 관련, 퀴즈 관련)는 그대로 둔다.

- [ ] **Step 7: 테스트 실행해 통과 확인**

Run: `npx vitest run src/lib/dataLoader.test.js`
Expected: PASS — 삭제한 테스트를 제외한 나머지가 모두 통과해야 한다

- [ ] **Step 8: 더 이상 쓰이지 않는 정적 자료 파일 삭제**

```bash
rm src/data/topics.json src/data/mappings.json
```

- [ ] **Step 9: 커밋**

```bash
git add src/lib/materialsRepo.js src/lib/materialsRepo.test.js src/lib/dataLoader.js src/lib/dataLoader.test.js
git rm src/data/topics.json src/data/mappings.json
git commit -m "feat: add Firestore-backed materialsRepo, remove static Seocheon-topic data"
```

---

## Task 7: 자료 관리 화면 (MaterialsAdminPage)

**Files:**
- Create: `src/pages/MaterialsAdminPage.jsx`
- Create: `src/pages/MaterialsAdminPage.test.jsx`
- Modify: `src/App.jsx` (라우트 추가는 Task 10에서 한꺼번에 정리 — 이 태스크에서는 컴포넌트만 만든다)

**Interfaces:**
- Consumes: `getPublishers`, `getUnits`, `getTopics`, `getLessons`(`src/lib/dataLoader.js`), `fetchAllMaterials`, `createMaterial`, `updateMaterial`, `deleteMaterial`(`src/lib/materialsRepo.js`)

목록 화면과 생성/수정 폼을 한 페이지 컴포넌트 안에서 `mode` 상태(`'list' | 'create' | {edit: materialId}`)로 전환한다. 자료 항목(사진/영상/QR)과 연결할 차시는 각각 목록에 추가·삭제할 수 있는 반복 입력이다.

- [ ] **Step 1: 실패하는 테스트로 src/pages/MaterialsAdminPage.test.jsx 작성**

```jsx
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MaterialsAdminPage from './MaterialsAdminPage.jsx'

vi.mock('../lib/materialsRepo.js', () => ({
  fetchAllMaterials: vi.fn(),
  createMaterial: vi.fn(),
  updateMaterial: vi.fn(),
  deleteMaterial: vi.fn(),
}))

import {
  fetchAllMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from '../lib/materialsRepo.js'

const sampleMaterial = {
  id: 'm1',
  title: '장항 신성리 갈대밭',
  usageNote: '체험학습 전 사전 안내용',
  resources: [{ type: 'photo', title: '갈대밭 전경', url: 'https://example.com/photo.jpg' }],
  lessonRefs: [{ publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t2-l1' }],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MaterialsAdminPage', () => {
  it('자료 목록에 제목과 연결된 차시 개수를 보여준다', async () => {
    fetchAllMaterials.mockResolvedValue([sampleMaterial])
    render(<MaterialsAdminPage />)

    await waitFor(() => expect(screen.getByText('장항 신성리 갈대밭')).toBeInTheDocument())
    expect(screen.getByText('연결된 차시 1개')).toBeInTheDocument()
  })

  it('새로 만들기를 누르면 빈 폼이 보인다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    render(<MaterialsAdminPage />)
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    expect(screen.getByLabelText('제목')).toHaveValue('')
  })

  it('제목, 자료 항목, 연결 차시를 입력하고 저장하면 createMaterial이 호출된다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    createMaterial.mockResolvedValue('new-id')
    render(<MaterialsAdminPage />)
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '새 자료' } })

    fireEvent.change(screen.getByLabelText('자료 링크'), {
      target: { value: 'https://example.com/img.jpg' },
    })
    fireEvent.click(screen.getByRole('button', { name: '자료 항목 추가' }))
    expect(screen.getByText(/https:\/\/example\.com\/img\.jpg/)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('출판사'), { target: { value: 'ecrimedia' } })
    fireEvent.change(screen.getByLabelText('대단원'), { target: { value: 'ecrimedia-u1' } })
    fireEvent.change(screen.getByLabelText('학습주제'), { target: { value: 'ecrimedia-u1-t2' } })
    fireEvent.change(screen.getByLabelText('차시'), { target: { value: 'ecrimedia-u1-t2-l1' } })
    fireEvent.click(screen.getByRole('button', { name: '차시 추가' }))
    expect(screen.getByText('아이스크림미디어(한춘희) · 1. 우리가 사는 곳 · 장소에 대해 알아볼까요 · 1 / 1차시')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(createMaterial).toHaveBeenCalledWith({
        title: '새 자료',
        usageNote: '',
        resources: [{ type: 'photo', title: '', url: 'https://example.com/img.jpg' }],
        lessonRefs: [{ publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t2-l1' }],
      }),
    )
  })

  it('수정 버튼을 누르면 기존 값이 채워진 폼이 보인다', async () => {
    fetchAllMaterials.mockResolvedValue([sampleMaterial])
    render(<MaterialsAdminPage />)
    await waitFor(() => expect(screen.getByText('장항 신성리 갈대밭')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    expect(screen.getByLabelText('제목')).toHaveValue('장항 신성리 갈대밭')
  })

  it('수정 폼에서 저장하면 updateMaterial이 해당 id로 호출된다', async () => {
    fetchAllMaterials.mockResolvedValue([sampleMaterial])
    updateMaterial.mockResolvedValue()
    render(<MaterialsAdminPage />)
    await waitFor(() => expect(screen.getByText('장항 신성리 갈대밭')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '수정된 제목' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(updateMaterial).toHaveBeenCalledWith(
        'm1',
        expect.objectContaining({ title: '수정된 제목' }),
      ),
    )
  })

  it('삭제 버튼을 누르면 deleteMaterial이 호출되고 목록에서 사라진다', async () => {
    fetchAllMaterials.mockResolvedValue([sampleMaterial])
    deleteMaterial.mockResolvedValue()
    render(<MaterialsAdminPage />)
    await waitFor(() => expect(screen.getByText('장항 신성리 갈대밭')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(deleteMaterial).toHaveBeenCalledWith('m1'))
    expect(screen.queryByText('장항 신성리 갈대밭')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npx vitest run src/pages/MaterialsAdminPage.test.jsx`
Expected: FAIL — `src/pages/MaterialsAdminPage.jsx` 없음

- [ ] **Step 3: src/pages/MaterialsAdminPage.jsx 작성**

```jsx
import { useState, useEffect } from 'react'
import { getPublishers, getUnits, getTopics, getLessons } from '../lib/dataLoader.js'
import {
  fetchAllMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from '../lib/materialsRepo.js'

const RESOURCE_TYPE_LABELS = { photo: '사진', video: '영상', qr: 'QR' }
const emptyForm = { title: '', usageNote: '', resources: [], lessonRefs: [] }

function lessonRefLabel(ref) {
  const publisher = getPublishers().find((p) => p.id === ref.publisherId)
  const units = getUnits(ref.publisherId)
  for (const unit of units) {
    const topics = getTopics(ref.publisherId, unit.id)
    for (const topic of topics) {
      const lesson = getLessons(ref.publisherId, unit.id, topic.id).find(
        (l) => l.id === ref.lessonId,
      )
      if (lesson) {
        return `${publisher?.name ?? ref.publisherId} · ${unit.title} · ${topic.title} · ${lesson.차시순서} / ${lesson.전체차시}차시`
      }
    }
  }
  return ref.lessonId
}

function MaterialForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? emptyForm)
  const [resourceType, setResourceType] = useState('photo')
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')

  const publishers = getPublishers()
  const [publisherId, setPublisherId] = useState(publishers[0]?.id ?? '')
  const units = getUnits(publisherId)
  const [unitId, setUnitId] = useState(units[0]?.id ?? '')
  const topics = getTopics(publisherId, unitId)
  const [topicId, setTopicId] = useState(topics[0]?.id ?? '')
  const lessons = getLessons(publisherId, unitId, topicId)
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? '')

  function addResource() {
    if (!resourceUrl) return
    setForm((f) => ({
      ...f,
      resources: [...f.resources, { type: resourceType, title: resourceTitle, url: resourceUrl }],
    }))
    setResourceTitle('')
    setResourceUrl('')
  }

  function removeResource(index) {
    setForm((f) => ({ ...f, resources: f.resources.filter((_, i) => i !== index) }))
  }

  function addLessonRef() {
    if (!lessonId) return
    if (form.lessonRefs.some((r) => r.lessonId === lessonId)) return
    setForm((f) => ({ ...f, lessonRefs: [...f.lessonRefs, { publisherId, lessonId }] }))
  }

  function removeLessonRef(index) {
    setForm((f) => ({ ...f, lessonRefs: f.lessonRefs.filter((_, i) => i !== index) }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="material-form">
      <label htmlFor="material-title">제목</label>
      <input
        id="material-title"
        type="text"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />

      <label htmlFor="material-usage">활용법</label>
      <textarea
        id="material-usage"
        value={form.usageNote}
        onChange={(e) => setForm((f) => ({ ...f, usageNote: e.target.value }))}
      />

      <fieldset>
        <legend>자료 항목</legend>
        <ul>
          {form.resources.map((r, i) => (
            <li key={`${r.url}-${i}`}>
              <span>
                {RESOURCE_TYPE_LABELS[r.type]} · {r.title} · {r.url}
              </span>
              <button type="button" onClick={() => removeResource(i)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
        <label htmlFor="resource-type">종류</label>
        <select
          id="resource-type"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
        >
          <option value="photo">사진</option>
          <option value="video">영상</option>
          <option value="qr">QR</option>
        </select>
        <label htmlFor="resource-title">자료 제목</label>
        <input
          id="resource-title"
          type="text"
          value={resourceTitle}
          onChange={(e) => setResourceTitle(e.target.value)}
        />
        <label htmlFor="resource-url">자료 링크</label>
        <input
          id="resource-url"
          type="text"
          value={resourceUrl}
          onChange={(e) => setResourceUrl(e.target.value)}
        />
        <button type="button" onClick={addResource}>
          자료 항목 추가
        </button>
      </fieldset>

      <fieldset>
        <legend>연결된 차시</legend>
        <ul>
          {form.lessonRefs.map((ref, i) => (
            <li key={`${ref.lessonId}-${i}`}>
              <span>{lessonRefLabel(ref)}</span>
              <button type="button" onClick={() => removeLessonRef(i)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
        <label htmlFor="publisher-select">출판사</label>
        <select
          id="publisher-select"
          value={publisherId}
          onChange={(e) => {
            setPublisherId(e.target.value)
            setUnitId('')
            setTopicId('')
            setLessonId('')
          }}
        >
          {publishers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <label htmlFor="unit-select">대단원</label>
        <select
          id="unit-select"
          value={unitId}
          onChange={(e) => {
            setUnitId(e.target.value)
            setTopicId('')
            setLessonId('')
          }}
        >
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.title}
            </option>
          ))}
        </select>
        <label htmlFor="topic-select">학습주제</label>
        <select
          id="topic-select"
          value={topicId}
          onChange={(e) => {
            setTopicId(e.target.value)
            setLessonId('')
          }}
        >
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <label htmlFor="lesson-select">차시</label>
        <select id="lesson-select" value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.차시순서} / {l.전체차시}차시
            </option>
          ))}
        </select>
        <button type="button" onClick={addLessonRef}>
          차시 추가
        </button>
      </fieldset>

      <button type="submit">저장</button>
      <button type="button" onClick={onCancel}>
        취소
      </button>
    </form>
  )
}

export default function MaterialsAdminPage() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('list')

  function reload() {
    setLoading(true)
    fetchAllMaterials().then((list) => {
      setMaterials(list)
      setLoading(false)
    })
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleSave(form) {
    if (mode === 'create') {
      await createMaterial(form)
    } else if (mode && mode.edit) {
      await updateMaterial(mode.edit, form)
    }
    setMode('list')
    reload()
  }

  async function handleDelete(materialId) {
    await deleteMaterial(materialId)
    reload()
  }

  if (mode === 'create') {
    return <MaterialForm onSave={handleSave} onCancel={() => setMode('list')} />
  }

  if (mode && mode.edit) {
    const editing = materials.find((m) => m.id === mode.edit)
    return <MaterialForm initial={editing} onSave={handleSave} onCancel={() => setMode('list')} />
  }

  return (
    <main className="materials-admin-page">
      <h1>자료 관리</h1>
      <button type="button" onClick={() => setMode('create')}>
        새로 만들기
      </button>
      {loading && <p className="empty-state">불러오는 중...</p>}
      {!loading && materials.length === 0 && <p className="empty-state">아직 등록된 자료가 없어요.</p>}
      <ul className="materials-list">
        {materials.map((material) => (
          <li key={material.id}>
            <span>{material.title}</span>
            <span>연결된 차시 {material.lessonRefs?.length ?? 0}개</span>
            <button type="button" onClick={() => setMode({ edit: material.id })}>
              수정
            </button>
            <button type="button" onClick={() => handleDelete(material.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/pages/MaterialsAdminPage.test.jsx`
Expected: PASS (6 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/pages/MaterialsAdminPage.jsx src/pages/MaterialsAdminPage.test.jsx
git commit -m "feat: add materials admin page with create/edit/delete and lesson linking"
```

---

## Task 8: quizzesRepo.js (Firestore 퀴즈 CRUD) + dataLoader.js에서 구 퀴즈 로직 제거

**Files:**
- Create: `src/lib/quizzesRepo.js`
- Create: `src/lib/quizzesRepo.test.js`
- Modify: `src/lib/dataLoader.js`
- Modify: `src/lib/dataLoader.test.js`
- Delete: `src/data/quizzes.json`

**Interfaces:**
- Produces (named export, `src/lib/quizzesRepo.js`):
  - `Question` shape: `{ id, scope, refId, type, question, choices?, answerIndex?, answer? }` (`type`: `'multiple-choice'|'ox'|'short-answer'`. `multiple-choice`는 `choices`(string[])+`answerIndex`(number), `ox`/`short-answer`는 `answer`(string, `ox`는 `"O"|"X"`))
  - `fetchQuestions(scope, refId) -> Promise<Question[]>`
  - `createQuestion({scope, refId, type, question, choices, answerIndex, answer}) -> Promise<string>`
  - `updateQuestion(questionId, questionData) -> Promise<void>`
  - `deleteQuestion(questionId) -> Promise<void>`
- Consumes: `db`(`src/firebase.js`)

기존 `dataLoader.js`의 `selectQuizQuestions`/`getQuizQuestions`는 "차시 단위 문제를 학습주제/대단원 범위로 자동 합산"하는 방식이었다(`parentTopicId`/`parentUnitId` 필드로 굴려서 합치기). 이번에는 관리자가 차시/학습주제/대단원 범위를 직접 골라 문제를 만들므로, 그 롤업 로직을 없애고 `scope`+`refId`로 정확히 일치하는 문제만 조회하는 방식으로 바꾼다.

- [ ] **Step 1: 실패하는 테스트로 src/lib/quizzesRepo.test.js 작성**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import {
  fetchQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from './quizzesRepo.js'

vi.mock('../firebase.js', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...args) => ({ __collection: args })),
  doc: vi.fn((...args) => ({ __doc: args })),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn((...args) => ({ __query: args })),
  where: vi.fn((...args) => ({ __where: args })),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function fakeSnapshot(docs) {
  return { docs: docs.map((d) => ({ id: d.id, data: () => d.data })) }
}

describe('fetchQuestions', () => {
  it('scope와 refId가 정확히 일치하는 문제만 조회한다', async () => {
    getDocs.mockResolvedValue(
      fakeSnapshot([{ id: 'q1', data: { type: 'ox', question: '문제1', answer: 'O' } }]),
    )
    const result = await fetchQuestions('lesson', 'ecrimedia-u1-t5-l1')
    expect(where).toHaveBeenCalledWith('scope', '==', 'lesson')
    expect(where).toHaveBeenCalledWith('refId', '==', 'ecrimedia-u1-t5-l1')
    expect(result).toEqual([{ id: 'q1', type: 'ox', question: '문제1', answer: 'O' }])
  })
})

describe('createQuestion', () => {
  it('새 문제를 추가하고 생성된 id를 반환한다', async () => {
    addDoc.mockResolvedValue({ id: 'new-id' })
    const id = await createQuestion({
      scope: 'lesson',
      refId: 'ecrimedia-u1-t5-l1',
      type: 'multiple-choice',
      question: '질문',
      choices: ['a', 'b'],
      answerIndex: 0,
    })
    expect(id).toBe('new-id')
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: 'multiple-choice', answerIndex: 0 }),
    )
  })
})

describe('updateQuestion', () => {
  it('기존 문제를 갱신한다', async () => {
    updateDoc.mockResolvedValue()
    await updateQuestion('q1', { type: 'ox', question: '바뀐 문제', answer: 'X' })
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ question: '바뀐 문제' }),
    )
  })
})

describe('deleteQuestion', () => {
  it('문제를 삭제한다', async () => {
    deleteDoc.mockResolvedValue()
    await deleteQuestion('q1')
    expect(deleteDoc).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npx vitest run src/lib/quizzesRepo.test.js`
Expected: FAIL — `src/lib/quizzesRepo.js` 없음

- [ ] **Step 3: src/lib/quizzesRepo.js 작성**

```js
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase.js'

const COLLECTION = 'quizzes'

export async function fetchQuestions(scope, refId) {
  const q = query(
    collection(db, COLLECTION),
    where('scope', '==', scope),
    where('refId', '==', refId),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createQuestion(questionData) {
  const ref = await addDoc(collection(db, COLLECTION), questionData)
  return ref.id
}

export async function updateQuestion(questionId, questionData) {
  await updateDoc(doc(db, COLLECTION, questionId), questionData)
}

export async function deleteQuestion(questionId) {
  await deleteDoc(doc(db, COLLECTION, questionId))
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/lib/quizzesRepo.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: src/lib/dataLoader.js에서 구 퀴즈 로직 제거**

`src/lib/dataLoader.js` 상단의 `import quizzesData from '../data/quizzes.json'` 줄과, `selectQuizQuestions`/`getQuizQuestions` 함수 정의를 통째로 삭제한다. 최종 파일은 다음과 같아야 한다:

```js
import publishersData from '../data/publishers.json'
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
```

- [ ] **Step 6: src/lib/dataLoader.test.js에서 구 퀴즈 관련 테스트 제거**

`describe('selectQuizQuestions', ...)` 블록 전체와 파일 상단 import 목록의 `selectQuizQuestions`/`getQuizQuestions`를 제거한다. 나머지(대단원/학습주제/차시 관련) 테스트는 그대로 둔다.

- [ ] **Step 7: 테스트 실행해 통과 확인**

Run: `npx vitest run src/lib/dataLoader.test.js`
Expected: PASS

- [ ] **Step 8: 더 이상 쓰이지 않는 정적 퀴즈 파일 삭제**

```bash
rm src/data/quizzes.json
```

- [ ] **Step 9: 커밋**

```bash
git add src/lib/quizzesRepo.js src/lib/quizzesRepo.test.js src/lib/dataLoader.js src/lib/dataLoader.test.js
git rm src/data/quizzes.json
git commit -m "feat: add Firestore-backed quizzesRepo, remove old rollup-based quiz logic"
```

---

## Task 9: 퀴즈 관리 화면 (QuizzesAdminPage)

**Files:**
- Create: `src/pages/QuizzesAdminPage.jsx`
- Create: `src/pages/QuizzesAdminPage.test.jsx`

**Interfaces:**
- Consumes: `getPublishers`, `getUnits`, `getTopics`, `getLessons`(`src/lib/dataLoader.js`), `fetchQuestions`, `createQuestion`, `updateQuestion`, `deleteQuestion`(`src/lib/quizzesRepo.js`)

범위(차시/학습주제/대단원)와 대상을 고르는 대상 선택 영역은 항상 출판사 → 대단원 → 학습주제 → 차시 선택지를 모두 보여주고, 실제 `refId`는 고른 범위에 맞는 단계의 id를 쓴다(`scope==='unit'`이면 대단원 id, `'topic'`이면 학습주제 id, `'lesson'`이면 차시 id) — 자료 관리 화면과 같은 선택 UI를 재사용해 구현을 단순하게 유지한다.

- [ ] **Step 1: 실패하는 테스트로 src/pages/QuizzesAdminPage.test.jsx 작성**

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import QuizzesAdminPage from './QuizzesAdminPage.jsx'

vi.mock('../lib/quizzesRepo.js', () => ({
  fetchQuestions: vi.fn(),
  createQuestion: vi.fn(),
  updateQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
}))

import {
  fetchQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../lib/quizzesRepo.js'

function selectTarget() {
  fireEvent.change(screen.getByLabelText('출판사'), { target: { value: 'ecrimedia' } })
  fireEvent.change(screen.getByLabelText('대단원'), { target: { value: 'ecrimedia-u1' } })
  fireEvent.change(screen.getByLabelText('학습주제'), { target: { value: 'ecrimedia-u1-t2' } })
  fireEvent.change(screen.getByLabelText('차시'), { target: { value: 'ecrimedia-u1-t2-l1' } })
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchQuestions.mockResolvedValue([])
})

describe('QuizzesAdminPage', () => {
  it('범위와 대상을 고르면 그 범위의 문제 목록을 보여준다', async () => {
    fetchQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '문제입니다', answer: 'O' },
    ])
    render(<QuizzesAdminPage />)
    selectTarget()

    await waitFor(() =>
      expect(fetchQuestions).toHaveBeenCalledWith('lesson', 'ecrimedia-u1-t2-l1'),
    )
    expect(screen.getByText('문제입니다')).toBeInTheDocument()
  })

  it('객관식 문제를 만들면 choices와 answerIndex를 담아 createQuestion을 호출한다', async () => {
    createQuestion.mockResolvedValue('new-id')
    render(<QuizzesAdminPage />)
    selectTarget()
    await waitFor(() => expect(fetchQuestions).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새 문제 추가' }))
    fireEvent.change(screen.getByLabelText('문제 유형'), { target: { value: 'multiple-choice' } })
    fireEvent.change(screen.getByLabelText('문제'), { target: { value: '질문입니다' } })
    fireEvent.change(screen.getByLabelText('보기 텍스트'), { target: { value: '보기1' } })
    fireEvent.click(screen.getByRole('button', { name: '보기 추가' }))
    fireEvent.change(screen.getByLabelText('보기 텍스트'), { target: { value: '보기2' } })
    fireEvent.click(screen.getByRole('button', { name: '보기 추가' }))
    fireEvent.click(screen.getByLabelText('정답: 보기2'))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(createQuestion).toHaveBeenCalledWith({
        scope: 'lesson',
        refId: 'ecrimedia-u1-t2-l1',
        type: 'multiple-choice',
        question: '질문입니다',
        choices: ['보기1', '보기2'],
        answerIndex: 1,
      }),
    )
  })

  it('OX 문제를 만들면 answer:"O"|"X"로 createQuestion을 호출한다', async () => {
    createQuestion.mockResolvedValue('new-id')
    render(<QuizzesAdminPage />)
    selectTarget()
    await waitFor(() => expect(fetchQuestions).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새 문제 추가' }))
    fireEvent.change(screen.getByLabelText('문제 유형'), { target: { value: 'ox' } })
    fireEvent.change(screen.getByLabelText('문제'), { target: { value: 'OX 질문' } })
    fireEvent.click(screen.getByLabelText('정답: X'))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(createQuestion).toHaveBeenCalledWith({
        scope: 'lesson',
        refId: 'ecrimedia-u1-t2-l1',
        type: 'ox',
        question: 'OX 질문',
        answer: 'X',
      }),
    )
  })

  it('단답식 문제를 만들면 answer 텍스트로 createQuestion을 호출한다', async () => {
    createQuestion.mockResolvedValue('new-id')
    render(<QuizzesAdminPage />)
    selectTarget()
    await waitFor(() => expect(fetchQuestions).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새 문제 추가' }))
    fireEvent.change(screen.getByLabelText('문제 유형'), { target: { value: 'short-answer' } })
    fireEvent.change(screen.getByLabelText('문제'), { target: { value: '단답 질문' } })
    fireEvent.change(screen.getByLabelText('정답'), { target: { value: '정답텍스트' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(createQuestion).toHaveBeenCalledWith({
        scope: 'lesson',
        refId: 'ecrimedia-u1-t2-l1',
        type: 'short-answer',
        question: '단답 질문',
        answer: '정답텍스트',
      }),
    )
  })

  it('수정 버튼을 누르면 기존 값이 채워진 폼이 보인다', async () => {
    fetchQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '문제입니다', answer: 'O' },
    ])
    render(<QuizzesAdminPage />)
    selectTarget()
    await waitFor(() => expect(screen.getByText('문제입니다')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    expect(screen.getByLabelText('문제')).toHaveValue('문제입니다')
  })

  it('삭제 버튼을 누르면 deleteQuestion이 호출되고 목록에서 사라진다', async () => {
    fetchQuestions.mockResolvedValue([
      { id: 'q1', scope: 'lesson', refId: 'ecrimedia-u1-t2-l1', type: 'ox', question: '문제입니다', answer: 'O' },
    ])
    deleteQuestion.mockResolvedValue()
    render(<QuizzesAdminPage />)
    selectTarget()
    await waitFor(() => expect(screen.getByText('문제입니다')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(deleteQuestion).toHaveBeenCalledWith('q1'))
    expect(screen.queryByText('문제입니다')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npx vitest run src/pages/QuizzesAdminPage.test.jsx`
Expected: FAIL — `src/pages/QuizzesAdminPage.jsx` 없음

- [ ] **Step 3: src/pages/QuizzesAdminPage.jsx 작성**

```jsx
import { useState, useEffect } from 'react'
import { getPublishers, getUnits, getTopics, getLessons } from '../lib/dataLoader.js'
import {
  fetchQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../lib/quizzesRepo.js'

const SCOPE_LABELS = { lesson: '차시', topic: '학습주제', unit: '대단원' }

function refIdFor(scope, { unitId, topicId, lessonId }) {
  if (scope === 'unit') return unitId
  if (scope === 'topic') return topicId
  return lessonId
}

function QuestionForm({ initial, onSave, onCancel }) {
  const [type, setType] = useState(initial?.type ?? 'multiple-choice')
  const [question, setQuestion] = useState(initial?.question ?? '')
  const [choices, setChoices] = useState(initial?.choices ?? [])
  const [choiceInput, setChoiceInput] = useState('')
  const [answerIndex, setAnswerIndex] = useState(initial?.answerIndex ?? 0)
  const [answer, setAnswer] = useState(initial?.answer ?? '')

  function addChoice() {
    if (!choiceInput) return
    setChoices((c) => [...c, choiceInput])
    setChoiceInput('')
  }

  function removeChoice(index) {
    setChoices((c) => c.filter((_, i) => i !== index))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (type === 'multiple-choice') {
      onSave({ type, question, choices, answerIndex })
    } else if (type === 'ox') {
      onSave({ type, question, answer })
    } else {
      onSave({ type, question, answer })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="question-form">
      <label htmlFor="question-type">문제 유형</label>
      <select id="question-type" value={type} onChange={(e) => setType(e.target.value)}>
        <option value="multiple-choice">객관식</option>
        <option value="ox">OX</option>
        <option value="short-answer">단답식</option>
      </select>

      <label htmlFor="question-text">문제</label>
      <input
        id="question-text"
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      {type === 'multiple-choice' && (
        <fieldset>
          <legend>보기</legend>
          <ul>
            {choices.map((choice, i) => (
              <li key={`${choice}-${i}`}>
                <label htmlFor={`answer-${i}`}>정답: {choice}</label>
                <input
                  id={`answer-${i}`}
                  type="radio"
                  name="answerIndex"
                  checked={answerIndex === i}
                  onChange={() => setAnswerIndex(i)}
                />
                <button type="button" onClick={() => removeChoice(i)}>
                  삭제
                </button>
              </li>
            ))}
          </ul>
          <label htmlFor="choice-input">보기 텍스트</label>
          <input
            id="choice-input"
            type="text"
            value={choiceInput}
            onChange={(e) => setChoiceInput(e.target.value)}
          />
          <button type="button" onClick={addChoice}>
            보기 추가
          </button>
        </fieldset>
      )}

      {type === 'ox' && (
        <fieldset>
          <legend>정답</legend>
          <label htmlFor="answer-o">정답: O</label>
          <input
            id="answer-o"
            type="radio"
            name="ox-answer"
            checked={answer === 'O'}
            onChange={() => setAnswer('O')}
          />
          <label htmlFor="answer-x">정답: X</label>
          <input
            id="answer-x"
            type="radio"
            name="ox-answer"
            checked={answer === 'X'}
            onChange={() => setAnswer('X')}
          />
        </fieldset>
      )}

      {type === 'short-answer' && (
        <>
          <label htmlFor="short-answer">정답</label>
          <input
            id="short-answer"
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </>
      )}

      <button type="submit">저장</button>
      <button type="button" onClick={onCancel}>
        취소
      </button>
    </form>
  )
}

export default function QuizzesAdminPage() {
  const [scope, setScope] = useState('lesson')
  const publishers = getPublishers()
  const [publisherId, setPublisherId] = useState(publishers[0]?.id ?? '')
  const units = getUnits(publisherId)
  const [unitId, setUnitId] = useState(units[0]?.id ?? '')
  const topics = getTopics(publisherId, unitId)
  const [topicId, setTopicId] = useState(topics[0]?.id ?? '')
  const lessons = getLessons(publisherId, unitId, topicId)
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? '')

  const [questions, setQuestions] = useState([])
  const [mode, setMode] = useState('list')

  const refId = refIdFor(scope, { unitId, topicId, lessonId })

  function reload() {
    if (!refId) return
    fetchQuestions(scope, refId).then(setQuestions)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, refId])

  async function handleSave(data) {
    if (mode === 'create') {
      await createQuestion({ scope, refId, ...data })
    } else if (mode && mode.edit) {
      await updateQuestion(mode.edit, { scope, refId, ...data })
    }
    setMode('list')
    reload()
  }

  async function handleDelete(questionId) {
    await deleteQuestion(questionId)
    reload()
  }

  if (mode === 'create') {
    return <QuestionForm onSave={handleSave} onCancel={() => setMode('list')} />
  }
  if (mode && mode.edit) {
    const editing = questions.find((q) => q.id === mode.edit)
    return <QuestionForm initial={editing} onSave={handleSave} onCancel={() => setMode('list')} />
  }

  return (
    <main className="quizzes-admin-page">
      <h1>퀴즈 관리</h1>
      <label htmlFor="scope-select">범위</label>
      <select id="scope-select" value={scope} onChange={(e) => setScope(e.target.value)}>
        {Object.entries(SCOPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <label htmlFor="publisher-select">출판사</label>
      <select
        id="publisher-select"
        value={publisherId}
        onChange={(e) => {
          setPublisherId(e.target.value)
          setUnitId('')
          setTopicId('')
          setLessonId('')
        }}
      >
        {publishers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <label htmlFor="unit-select">대단원</label>
      <select
        id="unit-select"
        value={unitId}
        onChange={(e) => {
          setUnitId(e.target.value)
          setTopicId('')
          setLessonId('')
        }}
      >
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.title}
          </option>
        ))}
      </select>
      <label htmlFor="topic-select">학습주제</label>
      <select
        id="topic-select"
        value={topicId}
        onChange={(e) => {
          setTopicId(e.target.value)
          setLessonId('')
        }}
      >
        {topics.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>
      <label htmlFor="lesson-select">차시</label>
      <select id="lesson-select" value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
        {lessons.map((l) => (
          <option key={l.id} value={l.id}>
            {l.차시순서} / {l.전체차시}차시
          </option>
        ))}
      </select>

      <button type="button" onClick={() => setMode('create')}>
        새 문제 추가
      </button>

      <ul className="questions-list">
        {questions.map((q) => (
          <li key={q.id}>
            <span>{q.question}</span>
            <button type="button" onClick={() => setMode({ edit: q.id })}>
              수정
            </button>
            <button type="button" onClick={() => handleDelete(q.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/pages/QuizzesAdminPage.test.jsx`
Expected: PASS (6 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/pages/QuizzesAdminPage.jsx src/pages/QuizzesAdminPage.test.jsx
git commit -m "feat: add quizzes admin page with per-type question forms"
```

---

## Task 10: 차시 상세 페이지를 Firestore 자료 + 실제 퀴즈 존재 여부 기반으로 개편

**Files:**
- Modify: `src/pages/LessonDetailPage.jsx`
- Modify: `src/pages/LessonDetailPage.test.jsx`

**Interfaces:**
- Consumes: `getUnit`, `getTopic`, `getLessons`, `getLesson`(`src/lib/dataLoader.js`), `fetchMaterialsForLesson`(`src/lib/materialsRepo.js`), `fetchQuestions`(`src/lib/quizzesRepo.js`), `ResourceCard`(`src/components/ResourceCard.jsx`)

교육과정 정보(대단원/학습주제/차시 메타/이전·다음 차시)는 지금처럼 동기적으로 즉시 렌더링되고, 자료·퀴즈 존재 여부만 Firestore에서 비동기로 불러온다.

- [ ] **Step 1: 실패하는 테스트로 src/pages/LessonDetailPage.test.jsx 전체 교체**

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LessonDetailPage from './LessonDetailPage.jsx'

vi.mock('../lib/materialsRepo.js', () => ({
  fetchMaterialsForLesson: vi.fn(),
}))
vi.mock('../lib/quizzesRepo.js', () => ({
  fetchQuestions: vi.fn(),
}))

import { fetchMaterialsForLesson } from '../lib/materialsRepo.js'
import { fetchQuestions } from '../lib/quizzesRepo.js'

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

beforeEach(() => {
  vi.clearAllMocks()
  fetchMaterialsForLesson.mockResolvedValue([])
  fetchQuestions.mockResolvedValue([])
})

describe('LessonDetailPage', () => {
  it('대단원명, 학습주제 제목, 차시순서/전체차시, 쪽수, 성취기준을 보여준다', async () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    expect(screen.getByText('1. 우리가 사는 곳')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '우리가 사는 곳에 있는 여러 장소를 표현해 볼까요' }),
    ).toBeInTheDocument()
    expect(screen.getByText('1 / 2차시 · 23~27쪽')).toBeInTheDocument()
    expect(
      screen.getByText(
        '[4사01-01] 주변 여러 장소에서의 경험과 느낌을 다양한 방식으로 표현하고, 장소감을 나누며 서로 존중하는 태도를 지닌다.',
      ),
    ).toBeInTheDocument()
    await waitFor(() => expect(fetchMaterialsForLesson).toHaveBeenCalled())
  })

  it('첫 차시에서는 이전 차시 링크가 없고 다음 차시 링크만 있다', () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    expect(screen.queryByRole('link', { name: '◀ 이전 차시' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '다음 차시 ▶' })).toHaveAttribute(
      'href',
      '/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l2',
    )
  })

  it('자료를 불러오는 동안 로딩 문구를, 없으면 안내 문구를 보여준다', async () => {
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')
    expect(screen.getByText('자료를 불러오는 중...')).toBeInTheDocument()

    await waitFor(() =>
      expect(screen.getByText('아직 연결된 서천 지역화 자료가 없어요.')).toBeInTheDocument(),
    )
  })

  it('연결된 자료가 있으면 제목과 자료 카드를 보여준다', async () => {
    fetchMaterialsForLesson.mockResolvedValue([
      {
        id: 'm1',
        title: '주변 여러 장소에서의 경험과 느낌 표현하기',
        usageNote: '',
        resources: [],
      },
    ])
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() =>
      expect(
        screen.getByText('주변 여러 장소에서의 경험과 느낌 표현하기'),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText('자료 준비 중입니다.')).toBeInTheDocument()
  })

  it('자료를 불러오지 못하면 에러 안내를 보여준다', async () => {
    fetchMaterialsForLesson.mockRejectedValue(new Error('network error'))
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('자료를 불러오지 못했어요.')).toBeInTheDocument())
  })

  it('문제가 있는 범위의 퀴즈 링크만 보여준다', async () => {
    fetchQuestions.mockImplementation((scope) =>
      Promise.resolve(scope === 'topic' ? [{ id: 'q1' }] : []),
    )
    renderPage('/p/ecrimedia/ecrimedia-u1/ecrimedia-u1-t5/ecrimedia-u1-t5-l1')

    await waitFor(() =>
      expect(screen.getByText('이 학습주제 퀴즈')).toHaveAttribute(
        'href',
        '/quiz/topic/ecrimedia-u1-t5',
      ),
    )
    expect(screen.queryByText('이 차시 퀴즈')).not.toBeInTheDocument()
    expect(screen.queryByText('이 대단원 퀴즈')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npx vitest run src/pages/LessonDetailPage.test.jsx`
Expected: FAIL — 현재 페이지는 `getSeocheonTopicsForLesson`(동기, 삭제됨)을 쓰고 퀴즈 링크가 항상 3개 보임

- [ ] **Step 3: src/pages/LessonDetailPage.jsx 전체 교체**

```jsx
import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getUnit, getTopic, getLessons, getLesson } from '../lib/dataLoader.js'
import { fetchMaterialsForLesson } from '../lib/materialsRepo.js'
import { fetchQuestions } from '../lib/quizzesRepo.js'
import ResourceCard from '../components/ResourceCard.jsx'

export default function LessonDetailPage() {
  const { publisherId, unitId, topicId, lessonId } = useParams()
  const unit = getUnit(publisherId, unitId)
  const topic = getTopic(publisherId, unitId, topicId)
  const lessons = getLessons(publisherId, unitId, topicId)
  const lesson = getLesson(publisherId, unitId, topicId, lessonId)

  const [materials, setMaterials] = useState([])
  const [materialsLoading, setMaterialsLoading] = useState(true)
  const [materialsError, setMaterialsError] = useState(false)
  const [quizScopes, setQuizScopes] = useState([])

  useEffect(() => {
    if (!lesson) return

    setMaterialsLoading(true)
    setMaterialsError(false)
    fetchMaterialsForLesson(lessonId)
      .then((list) => setMaterials(list))
      .catch(() => setMaterialsError(true))
      .finally(() => setMaterialsLoading(false))

    Promise.all([
      fetchQuestions('lesson', lessonId),
      fetchQuestions('topic', topicId),
      fetchQuestions('unit', unitId),
    ]).then(([lessonQuestions, topicQuestions, unitQuestions]) => {
      const scopes = []
      if (lessonQuestions.length > 0) scopes.push('lesson')
      if (topicQuestions.length > 0) scopes.push('topic')
      if (unitQuestions.length > 0) scopes.push('unit')
      setQuizScopes(scopes)
    })
  }, [lessonId, topicId, unitId, lesson])

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
        {prevLesson && <Link to={lessonPath(prevLesson)}>◀ 이전 차시</Link>}
        {nextLesson && <Link to={lessonPath(nextLesson)}>다음 차시 ▶</Link>}
      </nav>

      {materialsLoading && <p className="empty-state">자료를 불러오는 중...</p>}
      {!materialsLoading && materialsError && (
        <p className="empty-state">자료를 불러오지 못했어요.</p>
      )}
      {!materialsLoading && !materialsError && materials.length === 0 && (
        <p className="empty-state">아직 연결된 서천 지역화 자료가 없어요.</p>
      )}

      {!materialsLoading &&
        !materialsError &&
        materials.map((material) => (
          <section key={material.id} className="topic-block">
            <h2>{material.title}</h2>
            <p className="topic-usage">{material.usageNote || '활용 방법을 준비 중입니다.'}</p>
            {material.resources.length === 0 ? (
              <p className="empty-state">자료 준비 중입니다.</p>
            ) : (
              <div className="resource-list">
                {material.resources.map((resource, index) => (
                  <ResourceCard key={`${material.id}-${index}`} resource={resource} />
                ))}
              </div>
            )}
          </section>
        ))}

      <div className="quiz-links">
        {quizScopes.includes('lesson') && (
          <Link to={`/quiz/lesson/${lessonId}`} className="quiz-link">
            이 차시 퀴즈
          </Link>
        )}
        {quizScopes.includes('topic') && (
          <Link to={`/quiz/topic/${topicId}`} className="quiz-link">
            이 학습주제 퀴즈
          </Link>
        )}
        {quizScopes.includes('unit') && (
          <Link to={`/quiz/unit/${unitId}`} className="quiz-link">
            이 대단원 퀴즈
          </Link>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/pages/LessonDetailPage.test.jsx`
Expected: PASS (6 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/pages/LessonDetailPage.jsx src/pages/LessonDetailPage.test.jsx
git commit -m "feat: load lesson materials from Firestore, show quiz links only when questions exist"
```

---

## Task 11: 퀴즈 페이지를 실제로 풀 수 있게 개편 (객관식/OX/단답식)

**Files:**
- Modify: `src/pages/QuizPage.jsx`
- Modify: `src/pages/QuizPage.test.jsx`

**Interfaces:**
- Consumes: `fetchQuestions`(`src/lib/quizzesRepo.js`), `QuizPlaceholder`(`src/components/QuizPlaceholder.jsx`)

문제 하나하나가 독립적으로 채점된다(제출 버튼도 문제마다 따로). 점수 합산이나 저장은 하지 않는다.

- [ ] **Step 1: 실패하는 테스트로 src/pages/QuizPage.test.jsx 전체 교체**

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import QuizPage from './QuizPage.jsx'

vi.mock('../lib/quizzesRepo.js', () => ({
  fetchQuestions: vi.fn(),
}))

import { fetchQuestions } from '../lib/quizzesRepo.js'

function renderPage(path, initialIndex = 1) {
  return render(
    <MemoryRouter initialEntries={['/prev', path]} initialIndex={initialIndex}>
      <Routes>
        <Route path="/prev" element={<div>이전 화면</div>} />
        <Route path="/quiz/:scope/:refId" element={<QuizPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('QuizPage', () => {
  it('문제가 없으면 준비 중 안내와 0개를 보여준다', async () => {
    fetchQuestions.mockResolvedValue([])
    renderPage('/quiz/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() =>
      expect(screen.getByText('이 차시 퀴즈는 준비 중이에요.')).toBeInTheDocument(),
    )
    expect(screen.getByText('현재 등록된 문항 수: 0개')).toBeInTheDocument()
  })

  it('알 수 없는 scope는 안내 문구를 보여주고 문제를 불러오지 않는다', () => {
    renderPage('/quiz/garbage/x')
    expect(screen.getByText('알 수 없는 퀴즈 범위예요.')).toBeInTheDocument()
    expect(fetchQuestions).not.toHaveBeenCalled()
  })

  it('객관식 문제에서 정답을 고르고 제출하면 정답 메시지를 보여준다', async () => {
    fetchQuestions.mockResolvedValue([
      {
        id: 'q1',
        type: 'multiple-choice',
        question: '질문입니다',
        choices: ['보기1', '보기2'],
        answerIndex: 1,
      },
    ])
    renderPage('/quiz/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('질문입니다')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText('보기2'))
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('status')).toHaveTextContent('정답이에요')
  })

  it('객관식 문제에서 오답을 고르고 제출하면 오답 메시지를 보여준다', async () => {
    fetchQuestions.mockResolvedValue([
      {
        id: 'q1',
        type: 'multiple-choice',
        question: '질문입니다',
        choices: ['보기1', '보기2'],
        answerIndex: 1,
      },
    ])
    renderPage('/quiz/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('질문입니다')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText('보기1'))
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('status')).toHaveTextContent('아쉬워요')
  })

  it('OX 문제에서 정답 버튼을 누르고 제출하면 정답 메시지를 보여준다', async () => {
    fetchQuestions.mockResolvedValue([
      { id: 'q1', type: 'ox', question: 'OX 질문', answer: 'O' },
    ])
    renderPage('/quiz/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('OX 질문')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'O' }))
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('status')).toHaveTextContent('정답이에요')
  })

  it('단답식 문제는 공백을 제거하고 비교해서 채점한다', async () => {
    fetchQuestions.mockResolvedValue([
      { id: 'q1', type: 'short-answer', question: '단답 질문', answer: '정답' },
    ])
    renderPage('/quiz/lesson/ecrimedia-u1-t5-l1')

    await waitFor(() => expect(screen.getByText('단답 질문')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('답 입력'), { target: { value: ' 정답 ' } })
    fireEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('status')).toHaveTextContent('정답이에요')
  })

  it('뒤로 가기 버튼을 누르면 이전 화면으로 돌아간다', () => {
    renderPage('/quiz/lesson/ecrimedia-u1-t5-l1')
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }))
    expect(screen.getByText('이전 화면')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npx vitest run src/pages/QuizPage.test.jsx`
Expected: FAIL — 현재 페이지는 문제 텍스트만 나열하고 풀 수 없음

- [ ] **Step 3: src/pages/QuizPage.jsx 전체 교체**

```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchQuestions } from '../lib/quizzesRepo.js'
import QuizPlaceholder from '../components/QuizPlaceholder.jsx'

const VALID_SCOPES = ['lesson', 'topic', 'unit']

function QuizQuestion({ question }) {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [selectedOx, setSelectedOx] = useState(null)
  const [shortAnswer, setShortAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  function handleSubmit() {
    let correct = false
    if (question.type === 'multiple-choice') {
      correct = selectedIndex === question.answerIndex
    } else if (question.type === 'ox') {
      correct = selectedOx === question.answer
    } else {
      correct = shortAnswer.trim() === question.answer.trim()
    }
    setIsCorrect(correct)
    setSubmitted(true)
  }

  return (
    <li className="quiz-question">
      <p>{question.question}</p>

      {question.type === 'multiple-choice' && (
        <ul>
          {question.choices.map((choice, i) => (
            <li key={`${choice}-${i}`}>
              <label htmlFor={`choice-${question.id}-${i}`}>{choice}</label>
              <input
                id={`choice-${question.id}-${i}`}
                type="radio"
                name={`answer-${question.id}`}
                checked={selectedIndex === i}
                disabled={submitted}
                onChange={() => setSelectedIndex(i)}
              />
            </li>
          ))}
        </ul>
      )}

      {question.type === 'ox' && (
        <div className="ox-buttons">
          <button
            type="button"
            aria-pressed={selectedOx === 'O'}
            disabled={submitted}
            onClick={() => setSelectedOx('O')}
          >
            O
          </button>
          <button
            type="button"
            aria-pressed={selectedOx === 'X'}
            disabled={submitted}
            onClick={() => setSelectedOx('X')}
          >
            X
          </button>
        </div>
      )}

      {question.type === 'short-answer' && (
        <>
          <label htmlFor={`short-answer-${question.id}`}>답 입력</label>
          <input
            id={`short-answer-${question.id}`}
            type="text"
            value={shortAnswer}
            disabled={submitted}
            onChange={(e) => setShortAnswer(e.target.value)}
          />
        </>
      )}

      {!submitted && (
        <button type="button" onClick={handleSubmit}>
          제출
        </button>
      )}
      {submitted && (
        <p role="status">{isCorrect ? '정답이에요! 🎉' : '아쉬워요, 다시 도전해 보세요.'}</p>
      )}
    </li>
  )
}

export default function QuizPage() {
  const { scope, refId } = useParams()
  const navigate = useNavigate()
  const isValidScope = VALID_SCOPES.includes(scope)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isValidScope) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetchQuestions(scope, refId).then((list) => {
      setQuestions(list)
      setLoading(false)
    })
  }, [scope, refId, isValidScope])

  return (
    <main>
      <button type="button" onClick={() => navigate(-1)}>
        뒤로 가기
      </button>
      <h1>퀴즈</h1>
      {!isValidScope && <p className="empty-state">알 수 없는 퀴즈 범위예요.</p>}
      {isValidScope && loading && <p className="empty-state">불러오는 중...</p>}
      {isValidScope && !loading && questions.length === 0 && (
        <QuizPlaceholder scope={scope} questionCount={0} />
      )}
      {isValidScope && !loading && questions.length > 0 && (
        <ol className="quiz-question-list">
          {questions.map((question) => (
            <QuizQuestion key={question.id} question={question} />
          ))}
        </ol>
      )}
    </main>
  )
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/pages/QuizPage.test.jsx`
Expected: PASS (7 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/pages/QuizPage.jsx src/pages/QuizPage.test.jsx
git commit -m "feat: make quiz page interactive with per-question grading"
```

---

## Task 12: ResourceCard가 사진/QR을 실제로 렌더링하도록 개편

**Files:**
- Modify: `src/components/ResourceCard.jsx`
- Modify: `src/components/ResourceCard.test.jsx`

**Interfaces:**
- Consumes: `QRCodeSVG`(`qrcode.react`)
- `resource` shape: `{ type: 'photo'|'video'|'qr', title, url }` (Task 1의 `materials` 스펙과 동일)

- [ ] **Step 1: 실패하는 테스트로 src/components/ResourceCard.test.jsx 전체 교체**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ResourceCard from './ResourceCard.jsx'

describe('ResourceCard', () => {
  it('사진 자료는 이미지를 렌더링한다', () => {
    render(
      <ResourceCard resource={{ type: 'photo', title: '갈대밭', url: 'https://example.com/a.jpg' }} />,
    )
    expect(screen.getByRole('img', { name: '갈대밭' })).toHaveAttribute(
      'src',
      'https://example.com/a.jpg',
    )
  })

  it('QR 자료는 링크를 인코딩한 QR 코드를 렌더링한다', () => {
    render(<ResourceCard resource={{ type: 'qr', title: '안내', url: 'https://example.com/qr' }} />)
    expect(screen.getByLabelText('QR 코드')).toBeInTheDocument()
  })

  it('영상 자료는 QR·이미지 없이 "자료 열기" 링크만 보여준다', () => {
    render(
      <ResourceCard
        resource={{ type: 'video', title: '소개 영상', url: 'https://example.com/v' }}
      />,
    )
    expect(screen.getByText('소개 영상')).toBeInTheDocument()
    expect(screen.getByText('자료 열기')).toHaveAttribute('href', 'https://example.com/v')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('링크가 없으면 준비 중 문구를 보여준다', () => {
    render(<ResourceCard resource={{ type: 'video', title: '영상 자료' }} />)
    expect(screen.getByText('링크 준비 중')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npx vitest run src/components/ResourceCard.test.jsx`
Expected: FAIL — 현재는 `type==='image'`만 이미지를 그리고 QR은 렌더링하지 않음

- [ ] **Step 3: src/components/ResourceCard.jsx 전체 교체**

```jsx
import { QRCodeSVG } from 'qrcode.react'

const TYPE_LABELS = {
  photo: '🖼️ 사진',
  video: '🎬 영상',
  qr: '📱 QR 코드',
}

export default function ResourceCard({ resource }) {
  const label = TYPE_LABELS[resource.type] ?? resource.type

  return (
    <div className="resource-card">
      <span className="resource-type">{label}</span>
      <p className="resource-title">{resource.title || '제목 미정'}</p>
      {resource.type === 'photo' && resource.url && (
        <img src={resource.url} alt={resource.title || '자료 사진'} />
      )}
      {resource.type === 'qr' && resource.url && (
        <QRCodeSVG value={resource.url} size={128} role="img" aria-label="QR 코드" />
      )}
      {resource.url ? (
        <a href={resource.url} target="_blank" rel="noreferrer">
          자료 열기
        </a>
      ) : (
        <p className="resource-pending">링크 준비 중</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/components/ResourceCard.test.jsx`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/components/ResourceCard.jsx src/components/ResourceCard.test.jsx
git commit -m "feat: render photo images and generated QR codes in ResourceCard"
```

---

## Task 13: App.jsx 라우트 추가 + Firestore 보안 규칙 파일

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.test.jsx`
- Create: `firestore.rules`

**Interfaces:**
- Consumes: `MaterialsAdminPage`, `QuizzesAdminPage`, `AdminPasswordPage`(각 `src/pages/*.jsx`), `SuperAdminRoute`(`src/components/SuperAdminRoute.jsx`)

- [ ] **Step 1: 실패하는 테스트로 src/App.test.jsx 확장**

기존 4개 테스트는 그대로 두고, 파일 끝에 다음 2개를 추가한다:

```jsx
  it('세션 없이 자료 관리에 접근하면 로그인 페이지로 리다이렉트된다', () => {
    render(
      <MemoryRouter initialEntries={['/admin/materials']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('관리자 로그인')).toBeInTheDocument()
  })

  it('전체관리자 세션이 없으면 비밀번호 변경 페이지 대신 관리자 로그인으로 보낸다', () => {
    render(
      <MemoryRouter initialEntries={['/admin/password']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('관리자 로그인')).toBeInTheDocument()
  })
```

(이 두 테스트는 기존 `describe('App', ...)` 블록 안, 마지막 `})` 바로 앞에 추가한다.)

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `npx vitest run src/App.test.jsx`
Expected: FAIL — `/admin/materials`, `/admin/password` 라우트가 없어 catch-all(`/login`)로 빠짐(로그인 페이지 문구가 다르게 나옴)

- [ ] **Step 3: src/App.jsx 전체 교체**

```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import SuperAdminRoute from './components/SuperAdminRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import AdminLoginPage from './pages/AdminLoginPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import AdminPasswordPage from './pages/AdminPasswordPage.jsx'
import MaterialsAdminPage from './pages/MaterialsAdminPage.jsx'
import QuizzesAdminPage from './pages/QuizzesAdminPage.jsx'
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
          <Route path="/admin/materials" element={<MaterialsAdminPage />} />
          <Route path="/admin/quizzes" element={<QuizzesAdminPage />} />
        </Route>

        <Route element={<SuperAdminRoute />}>
          <Route path="/admin/password" element={<AdminPasswordPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}
```

- [ ] **Step 4: 테스트 재실행해 통과 확인**

Run: `npx vitest run src/App.test.jsx`
Expected: PASS (6 tests)

- [ ] **Step 5: firestore.rules 작성**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /materials/{document} {
      allow read, write: if true;
    }
    match /quizzes/{document} {
      allow read, write: if true;
    }
    match /adminConfig/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

- [ ] **Step 6: 커밋**

```bash
git add src/App.jsx src/App.test.jsx firestore.rules
git commit -m "feat: wire admin materials/quizzes/password routes, add Firestore security rules"
```

---

## Task 14: 최종 통합 확인

**Files:** 없음 (검증 전용 태스크 — 코드 변경 없음, 문제 발견 시에만 최소 수정)

**Interfaces:** 없음

- [ ] **Step 1: 전체 테스트 스위트 실행**

```bash
cd "C:\Users\박정민\seocheon-sahoe"
npm test
```

모든 테스트가 통과해야 한다. 실패가 있으면 원인을 조사해 수정하고(관련 태스크의 파일을 고친다) 재실행한다. `topics.json`/`mappings.json`/`quizzes.json`이나 삭제된 `selectSeocheonTopicsForLesson`/`getSeocheonTopicsForLesson`/`selectQuizQuestions`/`getQuizQuestions`(구 버전)에 대한 잔재 참조가 없는지 확인한다(`grep -rn "topics.json\|mappings.json\|selectSeocheonTopicsForLesson\|getSeocheonTopicsForLesson" src/` 결과가 비어 있어야 한다).

- [ ] **Step 2: 프로덕션 빌드 확인**

```bash
npm run build
```
Expected: 성공

- [ ] **Step 3: 실제 Firebase 프로젝트에 연결해 수동 점검**

이 단계는 `.env.local`에 실제 Firebase 프로젝트 설정값이 채워져 있고, Firestore 보안 규칙(`firestore.rules`)이 콘솔에 게시되어 있어야 의미가 있다(README의 "Firebase 프로젝트 설정" 섹션 참고). 값이 없으면 이 단계는 건너뛰고 그 사실을 보고한다.

```bash
npm run dev
```

다음을 순서대로 확인한다:
1. 학교관리자로 로그인(`/#/admin/login`, "학교관리자" 탭, 비밀번호는 Firestore `adminConfig/main` 문서의 값 — 처음이라면 콘솔에서 문서를 직접 만들어 `{ password: "20262026" }`로 채워둔다) → 대시보드에 "학교관리자 비밀번호 변경" 메뉴가 없는지 확인.
2. "자료 관리" → 새 자료 만들기(제목, 사진 링크 1개, 실제 존재하는 출판사/대단원/학습주제/차시 하나 연결) → 저장 → 목록에 나타나는지 확인.
3. 학교 계정으로 로그인해 그 차시 상세 페이지에 방금 만든 자료가 보이는지 확인.
4. "퀴즈 관리"에서 그 차시(scope=lesson) 대상으로 객관식 문제 1개를 만들고 저장 → 차시 상세 페이지에 "이 차시 퀴즈" 링크가 새로 보이는지 확인 → 눌러서 실제로 풀고 정답/오답이 즉시 표시되는지 확인.
5. 전체관리자 탭에서 Firebase 콘솔로 만든 계정으로 로그인 → "학교관리자 비밀번호 변경"에서 비밀번호를 바꾸고, 로그아웃 후 학교관리자 탭에서 바뀐 비밀번호로 로그인되는지 확인.
6. 방금 만든 자료·문제를 관리자 화면에서 삭제하고 학생 화면에서 사라졌는지 확인(테스트로 남긴 데이터 정리).

문제를 발견하면 해당 태스크의 파일로 돌아가 수정하고, `npm test`를 재실행해 회귀가 없는지 확인한다.

- [ ] **Step 4: 최종 커밋**

```bash
git status
git add -A
git commit -m "chore: final integration check for admin content and quiz management"
```

변경 사항이 이미 이전 태스크들에서 모두 커밋되어 `git status`가 깨끗하다면 이 커밋은 생략한다.
