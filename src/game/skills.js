import { CASTLE_X, FIELD_TOP, FIELD_BOTTOM, WORLD_W } from './constants.js'
import {
  addEffect,
  aimAt,
  damageEnemy,
  damageInRadius,
  densestPoint,
  enemiesInRadius,
  healCastle,
  healHero,
  nearestEnemy,
  spawnProjectile,
} from './combat.js'

// 쿨다운마다 한 번씩 발동하는 스킬의 공통 타이머 처리. 발동할 대상이 없으면
// (fire가 false를 돌려주면) 타이머를 다시 채우지 않고 다음 프레임에 재시도한다.
function onCooldown(sk, dt, cooldown, fire) {
  sk.timer -= dt
  if (sk.timer > 0) return
  if (fire() !== false) sk.timer = cooldown
}

function randomFieldPoint(state, minX, maxX) {
  return {
    x: minX + state.rng() * (maxX - minX),
    y: FIELD_TOP + 20 + state.rng() * (FIELD_BOTTOM - FIELD_TOP - 40),
  }
}

// kind: 공격 · 방어 · 보조 (카드 위에 표시되는 분류)
export const SKILLS = {
  // ── 마법사 ───────────────────────────────────────────
  fireball: {
    name: '화염구',
    kind: '공격',
    icon: '🔥',
    desc: '가까운 적에게 불덩이를 쏘고 주변까지 태워요.',
    update(state, sk, dt) {
      const h = state.hero
      onCooldown(sk, dt, 2.4 - sk.level * 0.2, () => {
        const t = nearestEnemy(state, h.x, h.y, 420)
        if (!t) return false
        spawnProjectile(state, {
          kind: 'fireball',
          x: h.x,
          y: h.y - 8,
          ...aimAt(h.x, h.y, t, 360),
          dmg: 16 + sk.level * 7,
          r: 9,
          aoe: { r: 46 + sk.level * 6, dmg: 10 + sk.level * 5 },
        })
      })
    },
  },
  frostLance: {
    name: '서리 창',
    kind: '공격',
    icon: '❄️',
    desc: '일렬로 선 적을 꿰뚫고 움직임을 늦춰요.',
    update(state, sk, dt) {
      const h = state.hero
      onCooldown(sk, dt, 2.8 - sk.level * 0.15, () => {
        const t = nearestEnemy(state, h.x, h.y, 480)
        if (!t) return false
        spawnProjectile(state, {
          kind: 'frost',
          x: h.x,
          y: h.y - 8,
          ...aimAt(h.x, h.y, t, 520),
          dmg: 14 + sk.level * 6,
          pierce: 99,
          r: 8,
          slow: { amount: 0.5, time: 1.6 + sk.level * 0.2 },
        })
      })
    },
  },
  chainLightning: {
    name: '연쇄 번개',
    kind: '공격',
    icon: '⚡',
    desc: '적들 사이로 번개를 이어 쏘아요.',
    update(state, sk, dt) {
      const h = state.hero
      onCooldown(sk, dt, 3.2 - sk.level * 0.2, () => {
        let cur = nearestEnemy(state, h.x, h.y, 380)
        if (!cur) return false
        const points = [{ x: h.x, y: h.y - 10 }]
        const hit = new Set()
        for (let i = 0; i < 3 + sk.level && cur; i++) {
          hit.add(cur)
          points.push({ x: cur.x, y: cur.y })
          damageEnemy(state, cur, 15 + sk.level * 6, { color: '#d8c8ff', stun: 0.15 })
          const from = cur
          cur = null
          let best = 150 * 150
          for (const e of state.enemies) {
            if (e.hp <= 0 || hit.has(e)) continue
            const d = (e.x - from.x) ** 2 + (e.y - from.y) ** 2
            if (d < best) {
              best = d
              cur = e
            }
          }
        }
        addEffect(state, { kind: 'lightning', points, dur: 0.25 })
      })
    },
  },
  meteor: {
    name: '운석 낙하',
    kind: '공격',
    icon: '☄️',
    desc: '적이 모인 곳에 강력한 불꽃 운석을 떨어뜨려요.',
    update(state, sk, dt) {
      onCooldown(sk, dt, 6.5 - sk.level * 0.5, () => {
        const p = densestPoint(state, 80)
        if (!p) return false
        const r = 66 + sk.level * 8
        const dmg = 38 + sk.level * 16
        addEffect(state, { kind: 'meteorFall', x: p.x, y: p.y, r, dur: 0.7 })
        state.delayed.push({
          t: 0.7,
          run: (s) => {
            damageInRadius(s, p.x, p.y, r, dmg, { color: '#ffb36b' })
            addEffect(s, { kind: 'blast', x: p.x, y: p.y, r, dur: 0.45, color: '#ff8a3d' })
            s.shake = 0.25
          },
        })
      })
    },
  },
  whirlwind: {
    name: '회오리바람',
    kind: '공격',
    icon: '🌪️',
    desc: '회오리로 적을 한곳에 모으고 늦추며 계속 공격해요.',
    update(state, sk, dt) {
      onCooldown(sk, dt, 7.5 - sk.level * 0.4, () => {
        const p = densestPoint(state, 90)
        if (!p) return false
        state.zones.push({
          kind: 'whirlwind',
          x: p.x,
          y: p.y,
          r: 70 + sk.level * 8,
          time: 3 + sk.level * 0.5,
          tick: 0.4,
          tickTimer: 0,
          dmg: 5 + sk.level * 2,
          pull: 60,
          slow: 0.45,
        })
      })
    },
  },
  iceArmor: {
    name: '얼음 갑옷',
    kind: '방어',
    icon: '🛡️',
    desc: '얼음 갑옷이 피해를 흡수해요. 깨지면 다시 자라요.',
    update(state, sk, dt) {
      const h = state.hero
      h.maxShield = 16 + sk.level * 10
      if (h.shield > 0) return
      sk.timer -= dt
      if (sk.timer <= 0) {
        h.shield = h.maxShield
        sk.timer = 12 - sk.level
      }
    },
  },

  // ── 전사 ─────────────────────────────────────────────
  spinSlash: {
    name: '회전 베기',
    kind: '공격',
    icon: '🌀',
    desc: '검을 크게 휘둘러 주변의 적을 모두 베어요.',
    update(state, sk, dt) {
      const h = state.hero
      onCooldown(sk, dt, 3.6 - sk.level * 0.3, () => {
        const r = 62 + sk.level * 8
        if (enemiesInRadius(state, h.x, h.y, r).length === 0) return false
        damageInRadius(state, h.x, h.y, r, 18 + sk.level * 8, { knockback: 30 })
        addEffect(state, { kind: 'spin', x: h.x, y: h.y, r, dur: 0.35 })
      })
    },
  },
  swordWave: {
    name: '검기',
    kind: '공격',
    icon: '🗡️',
    desc: '앞으로 뻗어 나가는 검기로 줄지어 선 적을 꿰뚫어요.',
    update(state, sk, dt) {
      const h = state.hero
      onCooldown(sk, dt, 2.6 - sk.level * 0.15, () => {
        const t = nearestEnemy(state, h.x, h.y, 460)
        if (!t) return false
        spawnProjectile(state, {
          kind: 'wave',
          x: h.x,
          y: h.y - 6,
          ...aimAt(h.x, h.y, t, 430),
          dmg: 16 + sk.level * 7,
          pierce: 99,
          r: 16,
          life: 1.2,
        })
      })
    },
  },
  shieldBash: {
    name: '방패 강타',
    kind: '방어',
    icon: '🛡️',
    desc: '방패로 앞의 적을 밀쳐 내고 잠시 기절시켜요.',
    update(state, sk, dt) {
      const h = state.hero
      onCooldown(sk, dt, 4.2 - sk.level * 0.3, () => {
        const cx = h.x + h.facing * 34
        const r = 46 + sk.level * 5
        if (enemiesInRadius(state, cx, h.y, r).length === 0) return false
        damageInRadius(state, cx, h.y, r, 10 + sk.level * 5, {
          knockback: 70 * h.facing,
          stun: 0.7 + sk.level * 0.12,
          color: '#cfe3ff',
        })
        addEffect(state, { kind: 'blast', x: cx, y: h.y, r, dur: 0.25, color: '#9cc4ff' })
      })
    },
  },
  warCry: {
    name: '수호의 함성',
    kind: '보조',
    icon: '📣',
    desc: '함성으로 수호자의 체력과 성벽을 함께 회복해요.',
    update(state, sk, dt) {
      onCooldown(sk, dt, 10 - sk.level * 0.6, () => {
        const h = state.hero
        if (h.dead) return false
        healHero(state, h.maxHp * (0.12 + sk.level * 0.04))
        healCastle(state, 18 + sk.level * 12)
        addEffect(state, { kind: 'ring', x: h.x, y: h.y, r: 80, dur: 0.5, color: '#ffe08a' })
      })
    },
  },
  ironSkin: {
    name: '강철 피부',
    kind: '방어',
    icon: '🪨',
    desc: '받는 피해를 줄이고 최대 체력을 늘려요.',
    passive: true,
    update(state, sk) {
      state.hero.bonusMaxHp = sk.level * 14
      state.hero.damageReduction = sk.level * 0.08
    },
  },
  leapStrike: {
    name: '도약 강타',
    kind: '공격',
    icon: '💥',
    desc: '적이 모인 곳으로 뛰어올라 내려찍어요.',
    update(state, sk, dt) {
      const h = state.hero
      onCooldown(sk, dt, 6.5 - sk.level * 0.4, () => {
        if (h.dead) return false
        const p = densestPoint(state, 70)
        if (!p || Math.hypot(p.x - h.x, p.y - h.y) > 280) return false
        h.x = Math.max(CASTLE_X + 20, p.x - 20)
        h.y = p.y
        const r = 58 + sk.level * 6
        damageInRadius(state, h.x, h.y, r, 28 + sk.level * 12, { stun: 0.4 })
        addEffect(state, { kind: 'blast', x: h.x, y: h.y, r, dur: 0.35, color: '#ffd36b' })
        state.shake = 0.15
      })
    },
  },

  // ── 궁수 ─────────────────────────────────────────────
  multiShot: {
    name: '다중 사격',
    kind: '공격',
    icon: '🏹',
    desc: '여러 발의 화살을 부채꼴로 한꺼번에 쏘아요.',
    update(state, sk, dt) {
      const h = state.hero
      onCooldown(sk, dt, 2.4 - sk.level * 0.15, () => {
        const t = nearestEnemy(state, h.x, h.y, 460)
        if (!t) return false
        const n = 3 + sk.level
        const base = Math.atan2(t.y - h.y, t.x - h.x)
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * 0.14
          spawnProjectile(state, {
            kind: 'arrow',
            x: h.x,
            y: h.y - 6,
            vx: Math.cos(a) * 540,
            vy: Math.sin(a) * 540,
            dmg: 9 + sk.level * 4,
            r: 5,
          })
        }
      })
    },
  },
  pierceArrow: {
    name: '관통 화살',
    kind: '공격',
    icon: '➶',
    desc: '아주 빠른 화살이 줄지어 선 적을 모두 꿰뚫어요.',
    update(state, sk, dt) {
      const h = state.hero
      onCooldown(sk, dt, 2.8 - sk.level * 0.2, () => {
        const t = nearestEnemy(state, h.x, h.y, 560)
        if (!t) return false
        spawnProjectile(state, {
          kind: 'bigArrow',
          x: h.x,
          y: h.y - 6,
          ...aimAt(h.x, h.y, t, 760),
          dmg: 20 + sk.level * 8,
          pierce: 99,
          r: 7,
        })
      })
    },
  },
  arrowRain: {
    name: '화살비',
    kind: '공격',
    icon: '🌧️',
    desc: '적이 모인 곳에 화살을 비처럼 쏟아부어요.',
    update(state, sk, dt) {
      onCooldown(sk, dt, 5.8 - sk.level * 0.4, () => {
        const p = densestPoint(state, 80)
        if (!p) return false
        state.zones.push({
          kind: 'arrowRain',
          x: p.x,
          y: p.y,
          r: 68 + sk.level * 6,
          time: 1.6,
          tick: 0.3,
          tickTimer: 0,
          dmg: 8 + sk.level * 4,
        })
      })
    },
  },
  poisonArrow: {
    name: '독화살',
    kind: '공격',
    icon: '🧪',
    desc: '맞은 적이 독에 걸려 계속 피해를 입어요.',
    update(state, sk, dt) {
      const h = state.hero
      onCooldown(sk, dt, 2.6 - sk.level * 0.15, () => {
        const t = nearestEnemy(state, h.x, h.y, 460)
        if (!t) return false
        spawnProjectile(state, {
          kind: 'poison',
          x: h.x,
          y: h.y - 6,
          ...aimAt(h.x, h.y, t, 500),
          dmg: 8 + sk.level * 3,
          r: 6,
          poison: { dps: 5 + sk.level * 3, time: 4 },
        })
      })
    },
  },
  swiftStep: {
    name: '재빠른 발걸음',
    kind: '보조',
    icon: '👟',
    desc: '이동 속도와 공격 속도가 빨라져요.',
    passive: true,
    update(state, sk) {
      state.hero.speedBonus = sk.level * 0.08
      state.hero.attackSpeedBonus = sk.level * 0.1
    },
  },
  snareTrap: {
    name: '올가미 덫',
    kind: '방어',
    icon: '🪤',
    desc: '전장에 덫을 깔아 밟은 적을 묶어 두어요.',
    update(state, sk, dt) {
      onCooldown(sk, dt, 4.5 - sk.level * 0.3, () => {
        const own = state.traps.filter((t) => t.kind === 'snare').length
        if (own >= 2 + sk.level) return false
        const p = randomFieldPoint(state, CASTLE_X + 90, 520)
        state.traps.push({ kind: 'snare', ...p, r: 26, dmg: 14 + sk.level * 6, root: 1.8 + sk.level * 0.3 })
      })
    },
  },

  // ── 건축가 ───────────────────────────────────────────
  turret: {
    name: '포탑 건설',
    kind: '공격',
    icon: '🏗️',
    desc: '수호자 곁에 자동으로 쏘는 포탑을 세워요.',
    update(state, sk, dt) {
      const h = state.hero
      onCooldown(sk, dt, 7 - sk.level * 0.4, () => {
        if (h.dead) return false
        if (state.turrets.length >= 1 + Math.ceil(sk.level / 2)) {
          // 가장 오래된 포탑을 새로 고쳐 세운다.
          state.turrets.sort((a, b) => a.life - b.life).shift()
        }
        state.turrets.push({
          x: Math.min(WORLD_W - 40, h.x + 26),
          y: Math.max(FIELD_TOP + 10, Math.min(FIELD_BOTTOM - 10, h.y + (state.rng() - 0.5) * 60)),
          life: 24,
          timer: 0,
          dmg: 8 + sk.level * 4,
          range: 240,
          rate: 0.9 - sk.level * 0.06,
        })
      })
    },
  },
  barricade: {
    name: '방벽',
    kind: '방어',
    icon: '🧱',
    desc: '튼튼한 방벽을 세워 적의 발을 묶어요.',
    update(state, sk, dt) {
      const h = state.hero
      onCooldown(sk, dt, 11 - sk.level * 0.6, () => {
        if (h.dead) return false
        if (state.walls.length >= 1 + Math.floor(sk.level / 2)) state.walls.shift()
        const maxHp = 90 + sk.level * 50
        state.walls.push({
          x: Math.min(WORLD_W - 60, h.x + 40),
          y: h.y,
          h: 110,
          hp: maxHp,
          maxHp,
          life: 16,
        })
      })
    },
  },
  fortify: {
    name: '성벽 보강',
    kind: '방어',
    icon: '🏰',
    desc: '성벽이 스스로 회복하고 받는 피해가 줄어들어요.',
    passive: true,
    update(state, sk, dt) {
      healCastle(state, (1.2 + sk.level * 1.2) * dt)
      state.castle.damageReduction = sk.level * 0.07
    },
  },
  landMine: {
    name: '지뢰',
    kind: '공격',
    icon: '💣',
    desc: '적이 밟으면 터지는 지뢰를 깔아요.',
    update(state, sk, dt) {
      onCooldown(sk, dt, 3.6 - sk.level * 0.25, () => {
        const own = state.traps.filter((t) => t.kind === 'mine').length
        if (own >= 3 + sk.level) return false
        const p = randomFieldPoint(state, CASTLE_X + 60, 600)
        state.traps.push({ kind: 'mine', ...p, r: 20, blast: 54 + sk.level * 5, dmg: 28 + sk.level * 12 })
      })
    },
  },
  catapult: {
    name: '투석기',
    kind: '공격',
    icon: '🪨',
    desc: '성에서 큰 돌을 날려 멀리 있는 적 무리를 부숴요.',
    update(state, sk, dt) {
      onCooldown(sk, dt, 5.4 - sk.level * 0.35, () => {
        const p = densestPoint(state, 80)
        if (!p) return false
        const from = { x: CASTLE_X - 30, y: 200 }
        const flight = 0.9
        const r = 56 + sk.level * 6
        const dmg = 28 + sk.level * 13
        addEffect(state, { kind: 'boulder', from, to: p, dur: flight })
        state.delayed.push({
          t: flight,
          run: (s) => {
            damageInRadius(s, p.x, p.y, r, dmg, { color: '#e6d3a8' })
            addEffect(s, { kind: 'blast', x: p.x, y: p.y, r, dur: 0.4, color: '#c9a36b' })
            s.shake = 0.15
          },
        })
      })
    },
  },
  repairHammer: {
    name: '수리 망치',
    kind: '보조',
    icon: '🔨',
    desc: '수호자 체력이 차오르고, 성 가까이 있으면 성벽도 고쳐요.',
    passive: true,
    update(state, sk, dt) {
      const h = state.hero
      if (h.dead) return
      h.hp = Math.min(h.maxHp, h.hp + (1.5 + sk.level) * dt)
      if (h.x < CASTLE_X + 140) healCastle(state, sk.level * 4 * dt)
    },
  },
}
