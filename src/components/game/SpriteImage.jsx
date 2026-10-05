import { useEffect, useRef } from 'react'
import { spriteCanvas, spriteSize } from '../../game/sprites.js'

// 게임 스프라이트를 메뉴 화면 등에서 그림처럼 보여 준다.
export default function SpriteImage({ name, scale = 4, className = '' }) {
  const ref = useRef(null)
  const { w, h } = spriteSize(name)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext?.('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(spriteCanvas(name), 0, 0, w * scale, h * scale)
  }, [name, scale, w, h])

  return (
    <canvas
      ref={ref}
      width={w * scale}
      height={h * scale}
      className={`sprite-image ${className}`}
      aria-hidden="true"
    />
  )
}
