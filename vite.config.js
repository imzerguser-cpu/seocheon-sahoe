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
