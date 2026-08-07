import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Firebase Hosting은 도메인 루트(예: seocheon-society.web.app/)에서 서비스하므로
// base를 '/'로 둡니다. GitHub Pages 하위 경로 배포로 다시 바꾸는 경우에만
// 저장소 이름과 일치하는 값('/seocheon-sahoe/' 등)으로 되돌리세요.
export default defineConfig({
  plugins: [react()],
  base: '/',
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
    // .worktrees는 git worktree 작업 공간이 리포지토리 안에 물리적으로 존재해
    // 기본 제외 목록(node_modules 등)만으로는 걸러지지 않는다. 제외하지 않으면
    // 워크트리 안의 중복 테스트 파일까지 실행되어 환경이 꼬이며 실패한다.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.worktrees/**'],
  },
})
