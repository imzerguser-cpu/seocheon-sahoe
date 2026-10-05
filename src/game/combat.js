// 스킬·기본 공격·포탑이 함께 쓰는 전투 도우미 함수 모음.

export function dist2(ax, ay, bx, by) {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy
}

export function aliveEnemies(state) {
  return state.enemies.filter((e) => e.hp > 0)
}

export function nearestEnemy(state, x, y, range = Infinity) {
  let best = null
  let bestD = range * range
  for (const e of state.enemies) {
    if (e.hp <= 0) continue
    const d = dist2(x, y, e.x, e.y)
    if (d <= bestD) {
      bestD = d
      best = e
    }
  }
  return best
}

export function enemiesInRadius(state, x, y, r) {
  return state.enemies.filter((e) => e.hp > 0 && dist2(x, y, e.x, e.y) <= (r + e.r) * (r + e.r))
}

// 적이 가장 많이 모여 있는 지점. 운석·화살비처럼 범위 스킬의 조준점으로 쓴다.
export function densestPoint(state, r = 70) {
  const alive = aliveEnemies(state)
  if (alive.length === 0) return null
  let best = alive[0]
  let bestCount = 0
  for (const e of alive) {
    let count = 0
    for (const o of alive) if (dist2(e.x, e.y, o.x, o.y) <= r * r) count++
    if (count > bestCount) {
      bestCount = count
      best = e
    }
  }
  return { x: best.x, y: best.y }
}

export function attackMultiplier(state) {
  return (1 + state.attackBonus) * (1 + state.level * 0.04)
}

export function damageEnemy(state, enemy, base, opts = {}) {
  if (enemy.hp <= 0) return 0
  const armor = enemy.armor ?? 0
  const amount = Math.max(1, Math.round(base * attackMultiplier(state) * (1 - armor)))
  enemy.hp -= amount
  enemy.hitFlash = 0.12
  if (opts.slow) {
    enemy.slow = Math.max(enemy.slow, opts.slow.amount)
    enemy.slowTime = Math.max(enemy.slowTime, opts.slow.time)
  }
  if (opts.stun) enemy.stun = Math.max(enemy.stun, opts.stun)
  if (opts.knockback) enemy.kx += opts.knockback
  if (opts.poison) {
    enemy.poison = Math.max(enemy.poison, opts.poison.dps)
    enemy.poisonTime = Math.max(enemy.poisonTime, opts.poison.time)
  }
  addFloater(state, enemy.x, enemy.y - enemy.r - 6, String(amount), opts.color ?? '#fff6d8')
  return amount
}

export function damageInRadius(state, x, y, r, base, opts) {
  const hit = enemiesInRadius(state, x, y, r)
  for (const e of hit) damageEnemy(state, e, base, opts)
  return hit.length
}

export function addEffect(state, effect) {
  state.effects.push({ t: 0, ...effect })
}

export function addFloater(state, x, y, text, color) {
  if (state.floaters.length > 80) state.floaters.shift()
  state.floaters.push({ x, y, text, color, t: 0 })
}

export function spawnProjectile(state, p) {
  state.projectiles.push({
    pierce: 1,
    r: 6,
    life: 2,
    hit: [],
    owner: 'hero',
    ...p,
  })
}

// (x,y)에서 target을 향해 speed로 날아가는 속도 벡터.
export function aimAt(x, y, target, speed) {
  const dx = target.x - x
  const dy = target.y - y
  const len = Math.hypot(dx, dy) || 1
  return { vx: (dx / len) * speed, vy: (dy / len) * speed }
}

export function healHero(state, amount) {
  const h = state.hero
  if (h.dead) return
  const before = h.hp
  h.hp = Math.min(h.maxHp, h.hp + amount)
  if (h.hp - before >= 1) addFloater(state, h.x, h.y - 30, `+${Math.round(h.hp - before)}`, '#8ef0a0')
}

export function healCastle(state, amount) {
  const c = state.castle
  c.hp = Math.min(c.maxHp, c.hp + amount)
}

export function skillLevel(state, id) {
  return state.skills.find((s) => s.id === id)?.level ?? 0
}
