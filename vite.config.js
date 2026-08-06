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
    // .worktrees는 git worktree 작업 공간이 리포지토리 안에 물리적으로 존재해
    // 기본 제외 목록(node_modules 등)만으로는 걸러지지 않는다. 제외하지 않으면
    // 워크트리 안의 중복 테스트 파일까지 실행되어 환경이 꼬이며 실패한다.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.worktrees/**'],
  },
})
