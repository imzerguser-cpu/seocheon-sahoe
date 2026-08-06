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

## GitHub Pages 배포

1. GitHub에 새 저장소 생성 (예: `seocheon-sahoe`)
2. 저장소 Settings → Pages → Build and deployment → Source를 "GitHub Actions"로 설정
3. 저장소 Settings → Secrets and variables → Actions에 `.env.example`과 동일한 이름으로 Firebase 설정값 6개를 Repository secret으로 등록
4. `vite.config.js`의 `base` 값이 저장소 이름과 일치하는지 확인 (`/저장소이름/`)
5. `master` 브랜치에 푸시하면 GitHub Actions가 자동으로 테스트 → 빌드 → 배포를 실행한다
6. 배포된 사이트 주소: `https://<github-사용자명>.github.io/seocheon-sahoe/`
