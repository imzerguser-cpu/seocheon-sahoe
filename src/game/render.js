import { CASTLE_X, FIELD_BOTTOM, HORIZON, STAGES, WORLD_H, WORLD_W } from './constants.js'
import { spriteCanvas, spriteSize } from './sprites.js'

const HERO_SCALE = 3
const ENEMY_SCALE = { goblin: 3, wolf: 3, boar: 3, ogre: 4 }

// ── 배경 (전장마다 한 번만 그려서 재사용) ─────────────────

const bgCache = new Map()

function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function drawPine(ctx, x, y, s, dark, light) {
  ctx.fillStyle = '#5a3a20'
  ctx.fillRect(x - 2 * s, y, 4 * s, 6 * s)
  for (let i = 0; i < 3; i++) {
    const w = (14 - i * 4) * s
    const top = y - (i + 1) * 7 * s
    ctx.fillStyle = i % 2 ? light : dark
    ctx.beginPath()
    ctx.moveTo(x, top - 4 * s)
    ctx.lineTo(x - w / 2, top + 8 * s)
    ctx.lineTo(x + w / 2, top + 8 * s)
    ctx.closePath()
    ctx.fill()
  }
}

function drawCastle(ctx) {
  // 성벽 몸체
  const stone = '#9aa0ad'
  const stoneDark = '#757b89'
  ctx.fillStyle = stone
  ctx.fillRect(0, 60, CASTLE_X, WORLD_H - 60)
  // 벽돌 무늬
  ctx.fillStyle = stoneDark
  for (let y = 64; y < WORLD_H; y += 14) {
    const off = ((y / 14) | 0) % 2 ? 0 : 14
    for (let x = -14 + off; x < CASTLE_X; x += 28) ctx.fillRect(x, y, 26, 2)
    for (let x = -14 + off; x < CASTLE_X; x += 28) ctx.fillRect(x + 26, y, 2, 14)
  }
  // 오른쪽 성가퀴
  ctx.fillStyle = '#868c99'
  ctx.fillRect(CASTLE_X - 14, 60, 14, WORLD_H - 60)
  ctx.fillStyle = stone
  for (let y = 70; y < WORLD_H; y += 30) ctx.fillRect(CASTLE_X - 2, y, 10, 18)
  ctx.fillStyle = stoneDark
  for (let y = 70; y < WORLD_H; y += 30) ctx.fillRect(CASTLE_X + 6, y, 2, 18)

  // 탑 두 개
  for (const ty of [110, 390]) {
    ctx.fillStyle = '#a7adb9'
    ctx.fillRect(28, ty, 76, 120)
    ctx.fillStyle = stoneDark
    for (let y = ty + 8; y < ty + 120; y += 16) ctx.fillRect(28, y, 76, 2)
    // 지붕
    ctx.fillStyle = '#2f5fc0'
    ctx.beginPath()
    ctx.moveTo(66, ty - 70)
    ctx.lineTo(18, ty + 4)
    ctx.lineTo(114, ty + 4)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#1f3f8a'
    ctx.beginPath()
    ctx.moveTo(66, ty - 70)
    ctx.lineTo(66, ty + 4)
    ctx.lineTo(114, ty + 4)
    ctx.closePath()
    ctx.fill()
    // 깃발
    ctx.fillStyle = '#5a3a20'
    ctx.fillRect(65, ty - 92, 3, 24)
    ctx.fillStyle = '#f0c04a'
    ctx.fillRect(68, ty - 92, 18, 10)
    // 창문 · 현수막
    ctx.fillStyle = '#1d1a2e'
    ctx.fillRect(58, ty + 26, 16, 22)
    ctx.fillStyle = '#2f5fc0'
    ctx.fillRect(40, ty + 62, 18, 40)
    ctx.fillRect(76, ty + 62, 18, 40)
    ctx.fillStyle = '#f0c04a'
    ctx.fillRect(46, ty + 76, 6, 8)
    ctx.fillRect(82, ty + 76, 6, 8)
  }
  // 성문
  const gy = 262
  ctx.fillStyle = '#5c616d'
  ctx.fillRect(56, gy - 6, 72, 104)
  ctx.fillStyle = '#6b4423'
  ctx.beginPath()
  ctx.moveTo(62, gy + 92)
  ctx.lineTo(62, gy + 30)
  ctx.quadraticCurveTo(92, gy - 10, 122, gy + 30)
  ctx.lineTo(122, gy + 92)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#4a2d16'
  for (let x = 70; x < 122; x += 12) ctx.fillRect(x, gy + 22, 3, 70)
  // 횃불
  for (const fy of [gy + 10, gy + 70]) {
    ctx.fillStyle = '#5a3a20'
    ctx.fillRect(126, fy, 4, 12)
    ctx.fillStyle = '#ffb340'
    ctx.fillRect(124, fy - 8, 8, 8)
    ctx.fillStyle = '#ff6a2a'
    ctx.fillRect(126, fy - 5, 4, 5)
  }
}

export function backgroundCanvas(stageIndex) {
  if (bgCache.has(stageIndex)) return bgCache.get(stageIndex)
  const st = STAGES[stageIndex] ?? STAGES[0]
  const c = makeCanvas(WORLD_W, WORLD_H)
  const ctx = c.getContext('2d')
  if (!ctx) return c
  const rnd = seeded(97 + stageIndex * 31)

  // 하늘과 먼 산
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON)
  sky.addColorStop(0, st.sky)
  sky.addColorStop(1, '#ffffff')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, WORLD_W, HORIZON)
  ctx.fillStyle = '#8fa3b8'
  ctx.beginPath()
  ctx.moveTo(0, HORIZON)
  for (let x = 0; x <= WORLD_W; x += 80) ctx.lineTo(x + 40, HORIZON - 30 - rnd() * 34)
  ctx.lineTo(WORLD_W, HORIZON)
  ctx.fill()

  // 들판
  const field = ctx.createLinearGradient(0, HORIZON - 30, 0, WORLD_H)
  field.addColorStop(0, st.grassDark)
  field.addColorStop(0.25, st.grass)
  field.addColorStop(1, st.grassDark)
  ctx.fillStyle = field
  ctx.fillRect(0, HORIZON - 30, WORLD_W, WORLD_H)

  // 흙길
  ctx.fillStyle = st.dirt
  for (let i = 0; i < 26; i++) {
    const x = CASTLE_X + rnd() * (WORLD_W - CASTLE_X)
    const y = HORIZON + 20 + rnd() * (FIELD_BOTTOM - HORIZON - 30)
    ctx.globalAlpha = 0.35 + rnd() * 0.3
    ctx.beginPath()
    ctx.ellipse(x, y, 26 + rnd() * 50, 8 + rnd() * 12, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // 풀 · 꽃
  for (let i = 0; i < 520; i++) {
    const x = rnd() * WORLD_W
    const y = HORIZON - 20 + rnd() * (WORLD_H - HORIZON + 20)
    ctx.fillStyle = rnd() < 0.5 ? st.grassDark : '#b9d978'
    ctx.fillRect(x, y, 2, 4)
    ctx.fillRect(x + 3, y + 1, 2, 3)
  }
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = ['#fff3b0', '#ffd0e0', '#ffffff', '#ffe27a'][i % 4]
    ctx.fillRect(rnd() * WORLD_W, HORIZON + rnd() * (WORLD_H - HORIZON), 3, 3)
  }

  // 전장별 풍경
  if (stageIndex === 0) {
    // 갈대
    for (let i = 0; i < 160; i++) {
      const x = rnd() * WORLD_W
      const y = rnd() < 0.5 ? HORIZON - 26 + rnd() * 18 : WORLD_H - 18 + rnd() * 14
      ctx.fillStyle = '#c9a54a'
      ctx.fillRect(x, y - 16, 2, 18)
      ctx.fillStyle = '#e6cf8a'
      ctx.fillRect(x - 1, y - 22, 4, 7)
    }
  } else if (stageIndex === 1) {
    for (let x = CASTLE_X + 10; x < WORLD_W; x += 34 + rnd() * 20) drawPine(ctx, x, HORIZON - 6, 1.6, '#2f5a2f', '#3f7a3c')
    for (let x = CASTLE_X + 20; x < WORLD_W; x += 40 + rnd() * 30) drawPine(ctx, x, WORLD_H + 8, 1.4, '#2f5a2f', '#3f7a3c')
  } else {
    // 강물
    ctx.fillStyle = '#5f8fc9'
    ctx.fillRect(0, HORIZON - 34, WORLD_W, 18)
    ctx.fillStyle = '#9fc4ee'
    for (let i = 0; i < 40; i++) ctx.fillRect(rnd() * WORLD_W, HORIZON - 30 + rnd() * 12, 14, 2)
    ctx.fillStyle = '#b4b0a4'
    for (let x = 0; x < WORLD_W; x += 24) ctx.fillRect(x, HORIZON - 16, 20, 6)
  }

  drawCastle(ctx)
  bgCache.set(stageIndex, c)
  return c
}

// ── 매 프레임 그리기 ─────────────────────────────────────

function drawSprite(ctx, name, x, y, scale, facing, frame, flash) {
  const img = spriteCanvas(name, frame, flash)
  const { w, h } = spriteSize(name)
  ctx.save()
  ctx.translate(Math.round(x), Math.round(y))
  if (facing < 0) ctx.scale(-1, 1)
  ctx.drawImage(img, Math.round((-w * scale) / 2), Math.round(-h * scale), w * scale, h * scale)
  ctx.restore()
}

function shadow(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(20, 30, 10, 0.28)'
  ctx.beginPath()
  ctx.ellipse(x, y, r, r * 0.35, 0, 0, Math.PI * 2)
  ctx.fill()
}

function bar(ctx, x, y, w, ratio, color) {
  ctx.fillStyle = 'rgba(20,20,30,0.75)'
  ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 6)
  ctx.fillStyle = color
  ctx.fillRect(x - w / 2, y, Math.max(0, w * ratio), 4)
}

export function drawGame(ctx, state, { showDamage = true } = {}) {
  ctx.imageSmoothingEnabled = false
  ctx.save()
  if (state.shake > 0) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8)
  ctx.drawImage(backgroundCanvas(state.stage - 1), 0, 0)

  // 성이 맞으면 붉게 번쩍인다.
  if (state.time - state.castle.hitTime < 0.15) {
    ctx.fillStyle = 'rgba(255, 60, 60, 0.18)'
    ctx.fillRect(0, 60, CASTLE_X + 8, WORLD_H - 60)
  }

  // 바닥에 깔리는 것들: 장판, 덫, 지뢰
  for (const z of state.zones) {
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.fillStyle = z.kind === 'whirlwind' ? '#bfefff' : '#fff1c4'
    ctx.beginPath()
    ctx.ellipse(z.x, z.y, z.r, z.r * 0.55, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 0.9
    ctx.strokeStyle = z.kind === 'whirlwind' ? '#e8fbff' : '#8a5a2b'
    ctx.lineWidth = 2
    if (z.kind === 'whirlwind') {
      for (let i = 0; i < 3; i++) {
        const a = state.time * 6 + (i * Math.PI * 2) / 3
        ctx.beginPath()
        ctx.ellipse(z.x, z.y - 10 - i * 10, z.r * (0.6 - i * 0.15), z.r * 0.18, 0, a, a + Math.PI * 1.2)
        ctx.stroke()
      }
    } else {
      for (let i = 0; i < 10; i++) {
        const ax = z.x + Math.cos(i * 2.4 + state.time * 3) * z.r * 0.7
        const ay = z.y + Math.sin(i * 1.7 + state.time * 5) * z.r * 0.35
        ctx.beginPath()
        ctx.moveTo(ax, ay - 14)
        ctx.lineTo(ax, ay)
        ctx.stroke()
      }
    }
    ctx.restore()
  }
  for (const t of state.traps) {
    if (t.kind === 'mine') {
      ctx.fillStyle = '#3a3a44'
      ctx.beginPath()
      ctx.arc(t.x, t.y, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = Math.sin(state.time * 8) > 0 ? '#ff4a3a' : '#7a2a22'
      ctx.fillRect(t.x - 2, t.y - 2, 4, 4)
    } else {
      ctx.strokeStyle = '#8a5a2b'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.ellipse(t.x, t.y, 14, 6, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#c9d1dc'
      for (let i = -2; i <= 2; i++) ctx.fillRect(t.x + i * 5 - 1, t.y - 5, 2, 5)
    }
  }

  // y 순서대로 그려서 앞뒤가 자연스럽게 겹치게 한다.
  const drawables = []
  for (const w of state.walls) drawables.push({ y: w.y + w.h / 2, draw: () => drawWall(ctx, w) })
  for (const t of state.turrets) drawables.push({ y: t.y, draw: () => drawTurret(ctx, t, state) })
  for (const e of state.enemies) drawables.push({ y: e.y, draw: () => drawEnemy(ctx, e) })
  const h = state.hero
  if (!h.dead) drawables.push({ y: h.y, draw: () => drawHero(ctx, state) })
  drawables.sort((a, b) => a.y - b.y)
  for (const d of drawables) d.draw()

  for (const p of state.projectiles) drawProjectile(ctx, p, state)
  for (const fx of state.effects) drawEffect(ctx, fx)

  if (showDamage) {
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    for (const f of state.floaters) {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 0.8)
      ctx.lineWidth = 3
      ctx.strokeStyle = '#1d1a2e'
      ctx.strokeText(f.text, f.x, f.y)
      ctx.fillStyle = f.color
      ctx.fillText(f.text, f.x, f.y)
    }
    ctx.globalAlpha = 1
  }

  if (h.dead) {
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.lineWidth = 4
    ctx.strokeStyle = '#1d1a2e'
    const text = `성에서 회복 중… ${Math.ceil(h.respawn)}초`
    ctx.strokeText(text, CASTLE_X + 120, 250)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text, CASTLE_X + 120, 250)
  }

  if (state.banner) {
    const a = Math.min(1, state.banner.t * 3, (2.2 - state.banner.t) * 3)
    ctx.globalAlpha = Math.max(0, a)
    ctx.fillStyle = 'rgba(15, 22, 40, 0.7)'
    ctx.fillRect(WORLD_W / 2 - 170, 200, 340, 64)
    ctx.font = 'bold 30px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffe08a'
    ctx.fillText(state.banner.text, WORLD_W / 2, 243)
    ctx.globalAlpha = 1
  }
  ctx.restore()
}

function drawHero(ctx, state) {
  const h = state.hero
  shadow(ctx, h.x, h.y + 2, 16)
  const frame = h.moving ? Math.floor(h.walk) % 2 : 0
  const flash = state.time - h.hitTime < 0.1
  const bob = h.moving ? 0 : Math.round(Math.sin(state.time * 3)) * 1
  drawSprite(ctx, h.cls, h.x, h.y + 4 + bob, HERO_SCALE, h.facing, frame, flash)
  if (h.shield > 0) {
    ctx.save()
    ctx.globalAlpha = 0.25 + 0.15 * (h.shield / Math.max(1, h.maxShield))
    ctx.fillStyle = '#bfefff'
    ctx.beginPath()
    ctx.ellipse(h.x, h.y - 26, 30, 38, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  bar(ctx, h.x, h.y - 70, 40, h.hp / h.maxHp, '#ff7a6b')
}

function drawEnemy(ctx, e) {
  const scale = ENEMY_SCALE[e.type] ?? 3
  shadow(ctx, e.x, e.y + 2, e.r)
  const frame = e.attacking ? 0 : Math.floor(e.walk) % 2
  const lunge = e.attacking && e.atkTimer > e.attackRate - 0.15 ? -4 : 0
  drawSprite(ctx, e.type, e.x + lunge, e.y + 4, scale, -1, frame, e.hitFlash > 0)
  if (e.slow > 0 || e.root > 0) {
    ctx.fillStyle = e.root > 0 ? 'rgba(201, 163, 107, 0.45)' : 'rgba(150, 220, 255, 0.35)'
    ctx.beginPath()
    ctx.ellipse(e.x, e.y, e.r + 4, (e.r + 4) * 0.4, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  if (e.poison > 0) {
    ctx.fillStyle = '#9be35a'
    ctx.fillRect(e.x - 3, e.y - e.r * 2 - 14, 6, 6)
  }
  if (e.stun > 0) {
    ctx.fillStyle = '#ffe27a'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('★', e.x, e.y - e.r * 2.6)
  }
  if (e.hp < e.maxHp || e.boss) {
    const { h } = spriteSize(e.type)
    bar(ctx, e.x, e.y - h * scale - 2, e.boss ? 70 : 28, e.hp / e.maxHp, e.boss ? '#c77dff' : '#ff5d4a')
  }
}

function drawWall(ctx, w) {
  const top = w.y - w.h / 2
  ctx.fillStyle = '#7a5a3a'
  ctx.fillRect(w.x - 8, top, 16, w.h)
  ctx.fillStyle = '#5a3a20'
  for (let y = top + 6; y < top + w.h; y += 18) ctx.fillRect(w.x - 8, y, 16, 3)
  ctx.fillStyle = '#c9d1dc'
  for (let y = top; y < top + w.h; y += 18) {
    ctx.beginPath()
    ctx.moveTo(w.x + 8, y + 4)
    ctx.lineTo(w.x + 18, y + 9)
    ctx.lineTo(w.x + 8, y + 13)
    ctx.fill()
  }
  bar(ctx, w.x, top - 10, 30, w.hp / w.maxHp, '#f0c04a')
}

function drawTurret(ctx, t, state) {
  shadow(ctx, t.x, t.y + 2, 14)
  ctx.fillStyle = '#6b4423'
  ctx.fillRect(t.x - 12, t.y - 14, 24, 14)
  ctx.fillStyle = '#9aa0ad'
  ctx.fillRect(t.x - 9, t.y - 30, 18, 16)
  ctx.fillStyle = '#5c616d'
  ctx.fillRect(t.x - 2, t.y - 26, 18, 6)
  ctx.fillStyle = t.timer > t.rate - 0.12 ? '#ffe27a' : '#3b6fb6'
  ctx.fillRect(t.x - 4, t.y - 34, 8, 6)
  if (t.life < 4 && Math.sin(state.time * 12) > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.fillRect(t.x - 12, t.y - 34, 24, 34)
  }
}

const PROJECTILE_COLORS = {
  bolt: ['#9fd8ff', '#ffffff'],
  fireball: ['#ff7a2a', '#ffe27a'],
  frost: ['#8fe3ff', '#ffffff'],
  hammer: ['#8d97a8', '#6b4423'],
  poison: ['#9be35a', '#4b7f2a'],
}

function drawProjectile(ctx, p, state) {
  const angle = Math.atan2(p.vy, p.vx)
  ctx.save()
  ctx.translate(p.x, p.y)
  if (p.kind === 'arrow' || p.kind === 'bigArrow' || p.kind === 'poison') {
    ctx.rotate(angle)
    const len = p.kind === 'bigArrow' ? 26 : 18
    ctx.fillStyle = '#8a5a2b'
    ctx.fillRect(-len / 2, -1, len, 3)
    ctx.fillStyle = p.kind === 'poison' ? '#9be35a' : p.kind === 'bigArrow' ? '#ffe27a' : '#e8eef7'
    ctx.beginPath()
    ctx.moveTo(len / 2 + 6, 0.5)
    ctx.lineTo(len / 2, -4)
    ctx.lineTo(len / 2, 5)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(-len / 2 - 2, -3, 4, 7)
  } else if (p.kind === 'wave') {
    ctx.rotate(angle)
    ctx.strokeStyle = 'rgba(220, 240, 255, 0.9)'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(-6, 0, 18, -1.1, 1.1)
    ctx.stroke()
  } else if (p.kind === 'hammer') {
    ctx.rotate(state.time * 18)
    ctx.fillStyle = '#6b4423'
    ctx.fillRect(-2, -8, 4, 16)
    ctx.fillStyle = '#8d97a8'
    ctx.fillRect(-7, -10, 14, 7)
  } else {
    const [outer, inner] = PROJECTILE_COLORS[p.kind] ?? PROJECTILE_COLORS.bolt
    ctx.fillStyle = outer
    ctx.beginPath()
    ctx.arc(0, 0, p.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = inner
    ctx.beginPath()
    ctx.arc(0, 0, p.r * 0.5, 0, Math.PI * 2)
    ctx.fill()
    if (p.kind === 'frost' || p.kind === 'fireball') {
      ctx.globalAlpha = 0.4
      ctx.fillStyle = outer
      ctx.fillRect(-Math.cos(angle) * 14 - 3, -Math.sin(angle) * 14 - 3, 6, 6)
    }
  }
  ctx.restore()
}

function drawEffect(ctx, fx) {
  const k = fx.t / fx.dur
  ctx.save()
  switch (fx.kind) {
    case 'slash': {
      ctx.strokeStyle = `rgba(255,255,255,${1 - k})`
      ctx.lineWidth = 4
      ctx.beginPath()
      const start = fx.facing > 0 ? -1.2 : Math.PI - 1.2
      ctx.arc(fx.x - fx.facing * 14, fx.y - 16, 30, start + k * 1.4, start + 1.2 + k * 1.4)
      ctx.stroke()
      break
    }
    case 'spin': {
      ctx.strokeStyle = `rgba(230,240,255,${1 - k})`
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.ellipse(fx.x, fx.y - 10, fx.r * (0.6 + k * 0.4), fx.r * 0.45, 0, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'blast':
    case 'ring': {
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = fx.color ?? '#ffb36b'
      if (fx.kind === 'blast') {
        ctx.globalAlpha = (1 - k) * 0.45
        ctx.beginPath()
        ctx.ellipse(fx.x, fx.y, fx.r * (0.5 + k * 0.5), fx.r * 0.5 * (0.5 + k * 0.5), 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1 - k
      }
      ctx.strokeStyle = fx.color ?? '#ffb36b'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.ellipse(fx.x, fx.y, fx.r * (0.5 + k * 0.6), fx.r * 0.5 * (0.5 + k * 0.6), 0, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'lightning': {
      ctx.strokeStyle = `rgba(216,200,255,${1 - k})`
      ctx.lineWidth = 3
      ctx.beginPath()
      fx.points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y)
        else {
          const prev = fx.points[i - 1]
          ctx.lineTo((prev.x + pt.x) / 2 + (i % 2 ? 8 : -8), (prev.y + pt.y) / 2 - 10)
          ctx.lineTo(pt.x, pt.y - 10)
        }
      })
      ctx.stroke()
      break
    }
    case 'meteorFall': {
      ctx.globalAlpha = 0.5
      ctx.strokeStyle = '#ff5d2a'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.ellipse(fx.x, fx.y, fx.r, fx.r * 0.5, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
      const mx = fx.x + 120 * (1 - k)
      const my = fx.y - 300 * (1 - k)
      ctx.fillStyle = '#ff7a2a'
      ctx.beginPath()
      ctx.arc(mx, my, 14, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffe27a'
      ctx.beginPath()
      ctx.arc(mx, my, 7, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'boulder': {
      const x = fx.from.x + (fx.to.x - fx.from.x) * k
      const y = fx.from.y + (fx.to.y - fx.from.y) * k - Math.sin(k * Math.PI) * 140
      ctx.fillStyle = '#8d8270'
      ctx.beginPath()
      ctx.arc(x, y, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#b4a890'
      ctx.fillRect(x - 5, y - 6, 5, 4)
      break
    }
    case 'poof': {
      ctx.globalAlpha = 1 - k
      ctx.fillStyle = '#e8e2f4'
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2
        ctx.fillRect(fx.x + Math.cos(a) * fx.r * k * 1.4 - 3, fx.y - 12 + Math.sin(a) * fx.r * k - 3, 6, 6)
      }
      break
    }
    default:
      break
  }
  ctx.restore()
}

export function screenToWorld(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((clientX - rect.left) / rect.width) * WORLD_W,
    y: ((clientY - rect.top) / rect.height) * WORLD_H,
  }
}
