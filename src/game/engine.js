import {
  CASTLE_X,
  FIELD_BOTTOM,
  FIELD_TOP,
  HERO_RADIUS,
  SKILL_MAX_LEVEL,
  SKILL_SLOT_COUNT,
  STAGE_COUNT,
  WAVES_PER_STAGE,
  WORLD_W,
  xpForLevel,
} from './constants.js'
import { addEffect, addFloater, damageEnemy, damageInRadius, dist2, healCastle, healHero, nearestEnemy, spawnProjectile, aimAt } from './combat.js'
import { HERO_CLASSES } from './heroes.js'
import { SKILLS } from './skills.js'
import { ENEMY_TYPES, buildWave, spawnInterval, waveScale } from './waves.js'

// 게임 상태는 하나의 평범한 객체이고, update()가 매 프레임 직접 고친다.
// mode: 'question'(지식의 시련) · 'pick'(힘 선택) · 'battle' · 'camp'(전장 사이 보상)
//       · 'victory' · 'defeat'
// battle이 아닐 때는 전투가 멈춰 있다.

const HERO_SPAWN = { x: CASTLE_X + 50, y: (FIELD_TOP + FIELD_BOTTOM) / 2 }
const RESPAWN_SECONDS = 5

export function createGame({ heroClass, rng = Math.random }) {
  const cls = HERO_CLASSES[heroClass]
  if (!cls) throw new Error(`알 수 없는 수호자: ${heroClass}`)
  return {
    rng,
    time: 0,
    mode: 'question',
    questionReason: 'intro',
    stage: 1,
    wave: 0,
    spawnQueue: [],
    spawnTimer: 0,
    waveDelay: 1.5,
    banner: null,
    shake: 0,
    castle: { hp: 1500, maxHp: 1500, hitTime: -99, damageReduction: 0 },
    hero: {
      cls: heroClass,
      x: HERO_SPAWN.x + 40,
      y: HERO_SPAWN.y,
      hp: cls.hp,
      baseMaxHp: cls.hp,
      maxHp: cls.hp,
      bonusMaxHp: 0,
      facing: 1,
      atkTimer: 0,
      dead: false,
      respawn: 0,
      shield: 0,
      maxShield: 0,
      damageReduction: 0,
      speedBonus: 0,
      attackSpeedBonus: 0,
      moving: false,
      walk: 0,
      hitTime: -99,
    },
    level: 0,
    xp: 0,
    xpNext: xpForLevel(0),
    pendingLevelUps: 0,
    skills: [],
    attackBonus: 0,
    pickChoices: null,
    campRewards: null,
    enemies: [],
    projectiles: [],
    effects: [],
    floaters: [],
    zones: [],
    traps: [],
    turrets: [],
    walls: [],
    delayed: [],
    nextId: 1,
    stats: { correct: 0, wrong: 0, kills: 0, stageCorrect: 0 },
  }
}

// ── 문제 · 힘 선택 · 야영지 ────────────────────────────────

// 지식의 시련 한 번이 끝났을 때 호출한다. 정답이면 힘 선택으로, 아니면 전투로.
export function finishQuestion(state, { correct, wrongCount }) {
  state.stats.wrong += wrongCount
  if (correct) {
    state.stats.correct++
    state.stats.stageCorrect++
    state.pickChoices = rollPickChoices(state)
    state.mode = 'pick'
  } else {
    state.mode = 'battle'
  }
}

export function rollPickChoices(state) {
  const cls = HERO_CLASSES[state.hero.cls]
  const pool = []
  for (const id of cls.skills) {
    const owned = state.skills.find((s) => s.id === id)
    if (owned) {
      if (owned.level < SKILL_MAX_LEVEL) pool.push({ id, from: owned.level, to: owned.level + 1 })
    } else if (state.skills.length < SKILL_SLOT_COUNT) {
      pool.push({ id, from: 0, to: 1 })
    }
  }
  shuffle(pool, state.rng)
  const picks = pool.slice(0, 3)
  if (picks.length === 0) picks.push({ id: 'recover', from: 0, to: 0 })
  return picks
}

export function chooseSkill(state, id) {
  if (id === 'recover') {
    healHero(state, state.hero.maxHp * 0.5)
    healCastle(state, state.castle.maxHp * 0.1)
  } else {
    const owned = state.skills.find((s) => s.id === id)
    if (owned) owned.level = Math.min(SKILL_MAX_LEVEL, owned.level + 1)
    else state.skills.push({ id, level: 1, timer: 0.5 })
  }
  state.pickChoices = null
  state.mode = 'battle'
}

export function rollCampRewards(state) {
  const correct = state.stats.stageCorrect
  const c = state.castle
  const healPercent = Math.min(60, 15 + correct * 8)
  const amount = Math.round((c.maxHp * healPercent) / 100)
  return [
    { target: 'attack', correct, percent: Math.min(40, 6 + correct * 5) },
    {
      target: 'castle',
      correct,
      percent: healPercent,
      current: Math.round(c.hp),
      max: c.maxHp,
      amount: Math.min(amount, c.maxHp - Math.round(c.hp)),
      after: Math.min(c.maxHp, Math.round(c.hp) + amount),
    },
  ]
}

export function chooseCampReward(state, target) {
  const reward = state.campRewards?.find((r) => r.target === target)
  if (!reward) return
  if (target === 'attack') state.attackBonus += reward.percent / 100
  else healCastle(state, (state.castle.maxHp * reward.percent) / 100)
  state.campRewards = null
  state.stage++
  state.wave = 0
  state.waveDelay = 2
  state.stats.stageCorrect = 0
  state.enemies = []
  state.projectiles = []
  state.zones = []
  state.traps = []
  state.walls = []
  state.turrets = []
  state.delayed = []
  const h = state.hero
  h.dead = false
  h.hp = h.maxHp
  h.x = HERO_SPAWN.x + 40
  h.y = HERO_SPAWN.y
  state.mode = 'battle'
}

// ── 매 프레임 갱신 ───────────────────────────────────────

// input: { dx, dy } (−1~1, 조이스틱·키보드) 또는 { target: {x,y} } (화면 터치 이동)
export function update(state, dt, input = {}) {
  if (state.mode !== 'battle') return
  dt = Math.min(dt, 0.05)
  state.time += dt
  state.shake = Math.max(0, state.shake - dt)

  updateWaves(state, dt)
  updateHero(state, dt, input)
  for (const sk of state.skills) SKILLS[sk.id].update(state, sk, dt)
  updateDelayed(state, dt)
  updateTurrets(state, dt)
  updateTraps(state)
  updateZones(state, dt)
  updateProjectiles(state, dt)
  updateEnemies(state, dt)
  collectDead(state)
  ageEffects(state, dt)

  if (state.castle.hp <= 0) {
    state.castle.hp = 0
    state.mode = 'defeat'
    return
  }
  if (state.mode === 'battle' && state.pendingLevelUps > 0) {
    state.pendingLevelUps--
    state.questionReason = 'levelup'
    state.mode = 'question'
  }
}

function updateWaves(state, dt) {
  if (state.banner) {
    state.banner.t += dt
    if (state.banner.t > 2.2) state.banner = null
  }
  const waveDone = state.spawnQueue.length === 0 && state.enemies.length === 0
  if (waveDone) {
    if (state.wave === WAVES_PER_STAGE) {
      if (state.stage === STAGE_COUNT) {
        state.mode = 'victory'
      } else {
        state.campRewards = rollCampRewards(state)
        state.mode = 'camp'
      }
      return
    }
    state.waveDelay -= dt
    if (state.waveDelay <= 0) {
      state.wave++
      state.spawnQueue = buildWave(state.stage, state.wave, state.rng)
      state.spawnTimer = 0
      state.waveDelay = 2.5
      state.banner = {
        t: 0,
        text: state.wave === WAVES_PER_STAGE ? '거인이 다가와요!' : `${state.wave}번째 웨이브`,
      }
    }
    return
  }
  if (state.spawnQueue.length > 0) {
    state.spawnTimer -= dt
    if (state.spawnTimer <= 0) {
      spawnEnemy(state, state.spawnQueue.shift())
      state.spawnTimer = spawnInterval(state.stage, state.wave) * (0.6 + state.rng() * 0.8)
    }
  }
}

export function spawnEnemy(state, type, at) {
  const def = ENEMY_TYPES[type]
  const scale = waveScale(state.stage, state.wave)
  const hp = Math.round(def.hp * scale)
  const e = {
    id: state.nextId++,
    type,
    x: at?.x ?? WORLD_W + 20 + state.rng() * 30,
    y: at?.y ?? FIELD_TOP + 16 + state.rng() * (FIELD_BOTTOM - FIELD_TOP - 32),
    hp,
    maxHp: hp,
    speed: def.speed * (0.9 + state.rng() * 0.2),
    dmg: def.dmg * (1 + (scale - 1) * 0.6),
    xp: def.xp,
    r: def.r,
    armor: def.armor ?? 0,
    boss: !!def.boss,
    attackRate: def.attackRate,
    atkTimer: 0,
    slow: 0,
    slowTime: 0,
    stun: 0,
    root: 0,
    kx: 0,
    poison: 0,
    poisonTime: 0,
    hitFlash: 0,
    walk: state.rng() * 10,
    attacking: false,
  }
  state.enemies.push(e)
  return e
}

function updateHero(state, dt, input) {
  const h = state.hero
  const cls = HERO_CLASSES[h.cls]
  h.maxHp = h.baseMaxHp + h.bonusMaxHp
  if (h.dead) {
    h.respawn -= dt
    if (h.respawn <= 0) {
      h.dead = false
      h.hp = h.maxHp
      h.x = HERO_SPAWN.x
      h.y = HERO_SPAWN.y
      addEffect(state, { kind: 'ring', x: h.x, y: h.y, r: 50, dur: 0.5, color: '#fff2b0' })
    }
    return
  }

  let dx = input.dx ?? 0
  let dy = input.dy ?? 0
  if (!dx && !dy && input.target) {
    const tx = input.target.x - h.x
    const ty = input.target.y - h.y
    const len = Math.hypot(tx, ty)
    if (len > 6) {
      dx = tx / len
      dy = ty / len
    }
  }
  const len = Math.hypot(dx, dy)
  if (len > 1) {
    dx /= len
    dy /= len
  }
  h.moving = len > 0.05
  if (h.moving) {
    const speed = cls.speed * (1 + h.speedBonus)
    h.x += dx * speed * dt
    h.y += dy * speed * dt
    if (Math.abs(dx) > 0.2) h.facing = dx > 0 ? 1 : -1
    h.walk += dt * 10
  }
  h.x = Math.max(CASTLE_X + 16, Math.min(WORLD_W - 16, h.x))
  h.y = Math.max(FIELD_TOP, Math.min(FIELD_BOTTOM, h.y))

  // 성 가까이 있으면 천천히 체력이 찬다.
  if (h.x < CASTLE_X + 90) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.04 * dt)

  h.atkTimer -= dt * (1 + h.attackSpeedBonus)
  if (h.atkTimer <= 0) {
    if (cls.attack(state) !== false) h.atkTimer = cls.attackCooldown
  }
}

export function damageHero(state, amount) {
  const h = state.hero
  if (h.dead) return
  let dmg = amount * (1 - h.damageReduction)
  if (h.shield > 0) {
    const absorbed = Math.min(h.shield, dmg)
    h.shield -= absorbed
    dmg -= absorbed
  }
  if (dmg <= 0) return
  h.hp -= dmg
  h.hitTime = state.time
  if (h.hp <= 0) {
    h.hp = 0
    h.dead = true
    h.respawn = RESPAWN_SECONDS
    h.shield = 0
  }
}

function damageCastle(state, amount) {
  const c = state.castle
  c.hp -= amount * (1 - c.damageReduction)
  c.hitTime = state.time
}

function updateDelayed(state, dt) {
  for (const d of state.delayed) d.t -= dt
  const due = state.delayed.filter((d) => d.t <= 0)
  state.delayed = state.delayed.filter((d) => d.t > 0)
  for (const d of due) d.run(state)
}

function updateTurrets(state, dt) {
  for (const t of state.turrets) {
    t.life -= dt
    t.timer -= dt
    if (t.timer <= 0) {
      const target = nearestEnemy(state, t.x, t.y, t.range)
      if (target) {
        spawnProjectile(state, { kind: 'bolt', x: t.x, y: t.y - 18, ...aimAt(t.x, t.y - 18, target, 420), dmg: t.dmg, r: 5 })
        t.timer = t.rate
      }
    }
  }
  state.turrets = state.turrets.filter((t) => t.life > 0)
  for (const w of state.walls) w.life -= dt
  state.walls = state.walls.filter((w) => w.life > 0 && w.hp > 0)
}

function updateTraps(state) {
  const remaining = []
  for (const trap of state.traps) {
    const victim = state.enemies.find((e) => e.hp > 0 && dist2(e.x, e.y, trap.x, trap.y) <= (trap.r + e.r) ** 2)
    if (!victim) {
      remaining.push(trap)
      continue
    }
    if (trap.kind === 'mine') {
      damageInRadius(state, trap.x, trap.y, trap.blast, trap.dmg, { color: '#ffcf8a' })
      addEffect(state, { kind: 'blast', x: trap.x, y: trap.y, r: trap.blast, dur: 0.35, color: '#ff9b4a' })
    } else {
      damageEnemy(state, victim, trap.dmg)
      victim.root = Math.max(victim.root, trap.root)
      addEffect(state, { kind: 'ring', x: trap.x, y: trap.y, r: 30, dur: 0.3, color: '#d9c38f' })
    }
  }
  state.traps = remaining
}

function updateZones(state, dt) {
  for (const z of state.zones) {
    z.time -= dt
    z.tickTimer -= dt
    for (const e of state.enemies) {
      if (e.hp <= 0) continue
      const d2 = dist2(e.x, e.y, z.x, z.y)
      if (d2 > (z.r + e.r) ** 2) continue
      if (z.pull && !e.boss) {
        const d = Math.sqrt(d2) || 1
        e.x += ((z.x - e.x) / d) * Math.min(d, z.pull * dt)
        e.y += ((z.y - e.y) / d) * Math.min(d, z.pull * dt)
      }
      if (z.slow) {
        e.slow = Math.max(e.slow, z.slow)
        e.slowTime = Math.max(e.slowTime, 0.2)
      }
    }
    if (z.tickTimer <= 0) {
      z.tickTimer = z.tick
      damageInRadius(state, z.x, z.y, z.r, z.dmg, { color: z.kind === 'whirlwind' ? '#d7f5ff' : '#fff6d8' })
    }
  }
  state.zones = state.zones.filter((z) => z.time > 0)
}

function updateProjectiles(state, dt) {
  for (const p of state.projectiles) {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.life -= dt
    if (p.x < CASTLE_X - 20 || p.x > WORLD_W + 40 || p.y < 40 || p.y > 560) p.life = 0
    if (p.life <= 0) continue
    for (const e of state.enemies) {
      if (e.hp <= 0 || p.hit.includes(e.id)) continue
      if (dist2(p.x, p.y, e.x, e.y) > (p.r + e.r) ** 2) continue
      p.hit.push(e.id)
      damageEnemy(state, e, p.dmg, { slow: p.slow, poison: p.poison })
      if (p.aoe) {
        for (const o of state.enemies) {
          if (o !== e && o.hp > 0 && dist2(o.x, o.y, e.x, e.y) <= (p.aoe.r + o.r) ** 2) damageEnemy(state, o, p.aoe.dmg)
        }
        addEffect(state, { kind: 'blast', x: e.x, y: e.y, r: p.aoe.r, dur: 0.3, color: '#ff8a3d' })
      }
      p.pierce--
      if (p.pierce <= 0) {
        p.life = 0
        break
      }
    }
  }
  state.projectiles = state.projectiles.filter((p) => p.life > 0)
}

function updateEnemies(state, dt) {
  const h = state.hero
  for (const e of state.enemies) {
    if (e.hp <= 0) continue
    e.hitFlash = Math.max(0, e.hitFlash - dt)
    e.slowTime -= dt
    if (e.slowTime <= 0) e.slow = 0
    if (e.poisonTime > 0) {
      e.poisonTime -= dt
      e.hp -= e.poison * dt
      if (e.poisonTime <= 0) e.poison = 0
    }
    // 밀려남(넉백)은 오른쪽(+) 또는 왼쪽(−)으로 빠르게 감쇠한다.
    if (e.kx) {
      const step = e.kx * Math.min(1, dt * 8)
      e.x = Math.min(WORLD_W + 30, e.x + (e.boss ? step * 0.3 : step))
      e.kx -= step
      if (Math.abs(e.kx) < 1) e.kx = 0
    }
    if (e.stun > 0) {
      e.stun -= dt
      e.attacking = false
      continue
    }
    e.atkTimer -= dt
    const speed = e.speed * (1 - e.slow)

    // 1) 근처에 수호자가 있으면 수호자와 싸운다.
    const reach = e.r + HERO_RADIUS + 4
    if (!h.dead && dist2(e.x, e.y, h.x, h.y) <= reach * reach) {
      attack(e, () => damageHero(state, e.dmg))
      continue
    }
    // 2) 방벽에 막히면 방벽을 공격한다.
    const wall = state.walls.find((w) => Math.abs(e.x - w.x) < e.r + 8 && Math.abs(e.y - w.y) < w.h / 2)
    if (wall && e.x > wall.x) {
      attack(e, () => {
        wall.hp -= e.dmg
      })
      continue
    }
    // 3) 성벽에 닿으면 성을 공격한다.
    if (e.x - e.r <= CASTLE_X) {
      attack(e, () => damageCastle(state, e.dmg))
      continue
    }
    e.attacking = false
    if (e.root > 0) {
      e.root -= dt
      continue
    }
    // 4) 성을 향해 걷되, 가까운 수호자 쪽으로 조금 몸을 튼다.
    let vx = -speed
    let vy = 0
    if (!h.dead && dist2(e.x, e.y, h.x, h.y) < 110 * 110 && h.x < e.x + 40) {
      const d = Math.hypot(h.x - e.x, h.y - e.y) || 1
      vx = ((h.x - e.x) / d) * speed
      vy = ((h.y - e.y) / d) * speed
    }
    e.x += vx * dt
    e.y = Math.max(FIELD_TOP, Math.min(FIELD_BOTTOM, e.y + vy * dt))
    e.walk += dt * (speed / 10)
  }

  function attack(e, hit) {
    e.attacking = true
    if (e.atkTimer <= 0) {
      e.atkTimer = e.attackRate
      hit()
    }
  }
}

function collectDead(state) {
  const alive = []
  for (const e of state.enemies) {
    if (e.hp > 0) {
      alive.push(e)
      continue
    }
    state.stats.kills++
    gainXp(state, e.xp)
    addEffect(state, { kind: 'poof', x: e.x, y: e.y, r: e.r, dur: 0.4 })
  }
  state.enemies = alive
}

export function gainXp(state, amount) {
  state.xp += amount
  while (state.xp >= state.xpNext) {
    state.xp -= state.xpNext
    state.level++
    state.xpNext = xpForLevel(state.level)
    state.pendingLevelUps++
    addFloater(state, state.hero.x, state.hero.y - 44, 'LEVEL UP!', '#ffe27a')
  }
}

function ageEffects(state, dt) {
  for (const fx of state.effects) fx.t += dt
  state.effects = state.effects.filter((fx) => fx.t < fx.dur)
  for (const f of state.floaters) {
    f.t += dt
    f.y -= 26 * dt
  }
  state.floaters = state.floaters.filter((f) => f.t < 0.8)
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
