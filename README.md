# 서천 지역화 자료 사이트

## 개발 환경 실행

```bash
npm install
npm run dev
```

## 테스트 실행

```bash
npm test
```

CI(GitHub Actions)가 배포 전에 이 명령으로 테스트를 실행하므로, 통과하지 않으면 배포되지 않는다.

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
   - `semester`(학기)는 1 또는 2이며, 해당 대단원이 1학기/2학기 중 어디에 속하는지 나타낸다. 화면에서 대단원 목록을 학기별로 묶어 보여주는 데 쓰인다.
   - `note`는 출판사 커리큘럼 전체에 대한 안내 문구(예: 실제 교과서와 다를 수 있다는 안내)로, 화면에는 노출되지 않는 참고용 메모다.
   - `차시순서`/`전체차시`는 **그 학습주제(topic) 안에서의 순서**다. 대단원 전체 차시 기준이 아니다. 예를 들어 한 학습주제에 차시가 2개 있으면 각 차시의 `차시순서`/`전체차시`는 1/2, 2/2가 되고, 그 값은 다른 학습주제로 넘어가면 다시 1부터 시작한다.
2. `src/data/curriculaIndex.js`에 새 파일을 import하고 `curricula` 객체에 `publisherId` 키로 추가한다.
3. `src/data/publishers.json`에 `{ "id": "newpub", "name": "화면에 보일 출판사 이름" }`을 추가한다.
4. 그 출판사를 쓰는 학교가 있다면 `src/data/schools.json`에 해당 학교의 `publisherId`를 이 값으로 설정한다.

## 서천 지역화 자료(자료 매핑) 추가하는 법

1. `src/data/topics.json`에 자료 항목을 추가한다(대단원/소단원/차시제목/활용법/resources).
2. `src/data/mappings.json`에 `{ "topicId": "...", "publisherId": "...", "lessonId": "..." }`를 추가해 원하는 출판사의 실제 차시 id와 연결한다. 차시 id는 `src/data/curricula/<publisherId>.json`에서 확인한다.

## 이미지 자료 추가 방법

이미지는 저장소 내 `public/images/` 아래에 파일로 둔다.

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
