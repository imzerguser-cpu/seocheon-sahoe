# 서천 지역화 자료 사이트

## Firebase 프로젝트 설정 (최초 1회)

이번 단계부터 관리자가 올리는 자료·퀴즈를 저장하기 위해 Firestore를 사용합니다.

1. https://console.firebase.google.com 에서 프로젝트를 새로 만들거나 기존 프로젝트를 연다.
2. Firestore Database를 프로덕션 모드로 생성한다.
3. Authentication → 로그인 방법 → "이메일/비밀번호" 사용 설정 → 사용자 탭에서 전체관리자 계정 1개를 수동으로 생성한다(이메일/비밀번호는 직접 정한다).
4. 프로젝트 설정 → 내 앱 → 웹 앱 추가 → 표시된 설정값을 `.env.local`에 복사한다(`.env.example` 참고).
5. GitHub 저장소 Settings → Secrets and variables → Actions에도 같은 이름으로 6개 값을 Repository secret으로 등록한다(배포 시 필요).
6. Firestore 보안 규칙은 `firestore.rules` 파일 내용을 Firebase 콘솔의 Firestore → 규칙 탭에 붙여넣고 게시한다.
7. 전체관리자 비밀번호를 바꾸려면 Authentication 콘솔에서 직접 재설정한다(사이트 내 비밀번호 찾기 기능 없음).
8. 학교관리자 로그인을 위해 Firestore에 `adminConfig` 컬렉션의 `main` 문서를 만든다. 새 프로젝트에는 이 문서가 아직 없어서, 만들기 전까지는 학교관리자 로그인이 항상 "비밀번호가 올바르지 않아요" 오류로 실패한다. 아래 두 방법 중 하나로 만든다.
   - Firebase 콘솔 Firestore Database → 데이터 탭에서 `adminConfig` 컬렉션을 새로 만들고, 문서 ID를 `main`으로, 문자열 필드 `password`의 값을 원하는 초기 학교관리자 비밀번호(예: `20262026`)로 저장한다.
   - 또는 3단계에서 만든 전체관리자 계정으로 먼저 `/admin/login`의 전체관리자 탭으로 로그인한 뒤, `/admin/password` 화면에서 새 학교관리자 비밀번호를 저장한다. 저장하는 순간 `adminConfig/main` 문서가 자동으로 만들어진다.

## 개발 환경 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev
```

## 테스트 실행

```bash
npm test
```

CI(GitHub Actions)가 배포 전에 이 명령으로 테스트를 실행하므로, 통과하지 않으면 배포되지 않는다.

## 학교/관리자 비밀번호 관리

- 학교별 비밀번호(학생 로그인용): `src/data/schools.json`의 각 학교 항목에서 `password` 값을 직접 수정하고 커밋·배포한다. 사이트 내에는 이 비밀번호를 바꾸는 UI가 없다.
- 관리자는 두 종류이며 관리 방식이 다르다.
  - **학교관리자**: 모든 학교가 공유하는 단순 비밀번호 하나로 `/admin/login`의 "학교관리자" 탭에서 로그인한다. 비밀번호는 Firestore `adminConfig/main` 문서(`password` 필드)에 저장되며, 전체관리자가 로그인 후 `/admin/password` 화면에서만 바꿀 수 있다(학교관리자 스스로는 바꿀 수 없다).
  - **전체관리자**: Firebase Authentication의 이메일/비밀번호 계정으로 `/admin/login`의 "전체관리자" 탭에서 로그인한다. 계정은 Firebase 콘솔의 Authentication → 사용자 탭에서 수동으로 1개 생성한다(위 Firebase 설정 3단계 참고). 비밀번호를 바꾸려면 Authentication 콘솔에서 직접 재설정한다.

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
   - `semester`(학기)는 1 또는 2이며, 해당 대단원이 1학기/2학기 중 어디에 속하는지 나타낸다. 화면에서 대단원 목록을 학기별로 묶어 보여주는 데 쓰인다.
   - `note`는 출판사 커리큘럼 전체에 대한 안내 문구(예: 실제 교과서와 다를 수 있다는 안내)로, 화면에는 노출되지 않는 참고용 메모다.
   - `차시순서`/`전체차시`는 **그 학습주제(topic) 안에서의 순서**다. 대단원 전체 차시 기준이 아니다. 예를 들어 한 학습주제에 차시가 2개 있으면 각 차시의 `차시순서`/`전체차시`는 1/2, 2/2가 되고, 그 값은 다른 학습주제로 넘어가면 다시 1부터 시작한다.
2. `src/data/curriculaIndex.js`에 새 파일을 import하고 `curricula` 객체에 `publisherId` 키로 추가한다.
3. `src/data/publishers.json`에 `{ "id": "newpub", "name": "화면에 보일 출판사 이름" }`을 추가한다.
4. 그 출판사를 쓰는 학교가 있다면 `src/data/schools.json`에 해당 학교의 `publisherId`를 이 값으로 설정한다.

## 서천 지역화 자료 · 퀴즈 관리 (관리자 UI)

서천 지역화 자료와 퀴즈는 더 이상 JSON 파일을 직접 고쳐서 추가하지 않는다. `/admin`에 학교관리자 또는 전체관리자로 로그인한 뒤 아래 화면에서 관리한다(둘 다 같은 관리 권한을 가진다).

### 자료 관리 (`/admin/materials`)

1. "새로 만들기"를 눌러 자료 제목과 활용법을 입력한다.
2. "자료 항목"에서 종류(사진/영상/QR코드)와 링크를 입력하고 추가한다. 자료 하나에 항목을 여러 개 붙일 수 있다.
3. "연결된 차시"에서 출판사 → 대단원 → 학습주제 → 차시를 골라 "차시 추가"를 누른다. 같은 자료를 여러 출판사·여러 차시에 동시에 연결할 수 있다(예: 같은 갈대밭 사진 자료를 아이스크림미디어 1단원 2차시와 천재교육(박) 1단원 3차시에 모두 연결).
4. 저장하면 Firestore `materials` 컬렉션에 저장되고, 연결된 각 차시의 상세 페이지에 이 자료가 자동으로 노출된다.

### 퀴즈 관리 (`/admin/quizzes`)

1. 문제 범위(차시/학습주제/대단원)를 고른다.
2. 출판사 → 대단원 → 학습주제 → (차시 범위를 골랐다면) 차시를 골라 문제가 속할 대상을 정한다.
3. "새 문제 추가"로 객관식/OX/단답식 문제를 만든다. 같은 대상에 문제를 여러 개 등록할 수 있다.
4. 학생이 차시 상세 페이지를 보면, 그 차시·소속 학습주제·소속 대단원 중 문제가 하나라도 등록된 범위에 대해서만 퀴즈 링크가 나타난다.

### 자료 종류 (`photo` / `video` / `qr`)

자료 항목은 URL만 입력하며, 파일 업로드 기능은 없다. 링크는 `http://` 또는 `https://`로 시작해야 하며, 그 외 형식은 저장이 거부된다.

- **사진**(`photo`, "사진"): 이미지 URL을 입력하면 그 이미지를 그대로 보여준다.
- **영상**(`video`, "영상"): 영상 URL(유튜브 등)을 입력하면 "자료 열기" 링크로 연결된다.
- **QR코드**(`qr`, "QR"): 목적지 URL을 입력하면, 사이트가 그 URL을 인코딩한 QR 코드 이미지를 화면에서 자동으로 생성해서 보여준다(QR 이미지 파일을 직접 만들어 올릴 필요 없음).

## GitHub Pages 배포

1. GitHub에 새 저장소 생성 (예: `seocheon-sahoe`)
2. 저장소 Settings → Pages → Build and deployment → Source를 "GitHub Actions"로 설정
3. `vite.config.js`의 `base` 값이 저장소 이름과 일치하는지 확인 (`/저장소이름/`)
4. `master` 브랜치에 푸시하면 GitHub Actions가 자동으로 테스트 → 빌드 → 배포를 실행한다
5. 배포된 사이트 주소: `https://<github-사용자명>.github.io/seocheon-sahoe/`
