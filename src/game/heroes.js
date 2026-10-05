import { addEffect, aimAt, damageInRadius, nearestEnemy, spawnProjectile } from './combat.js'

// 수호자(직업) 정의. stats는 선택 화면에 보여 줄 공격/보조/방어 별점(1~5)이다.
// attack(state)은 기본 공격 한 번을 수행하고, 공격할 대상이 없으면 false를 돌려준다.
export const HERO_CLASSES = {
  warrior: {
    name: '전사',
    desc: '검과 방패로 앞에서 적을 막아 서는 수호자',
    trait: '튼튼한 체력 · 가까운 적에게 강해요',
    stats: { 공격: 4, 보조: 2, 방어: 5 },
    hp: 150,
    speed: 150,
    attackCooldown: 0.55,
    skills: ['spinSlash', 'swordWave', 'shieldBash', 'warCry', 'ironSkin', 'leapStrike'],
    attack(state) {
      const h = state.hero
      const t = nearestEnemy(state, h.x, h.y, 78)
      if (!t) return false
      h.facing = t.x >= h.x ? 1 : -1
      const cx = h.x + h.facing * 32
      damageInRadius(state, cx, h.y, 40, 15, { knockback: 8 * h.facing })
      addEffect(state, { kind: 'slash', x: cx, y: h.y, facing: h.facing, dur: 0.18 })
    },
  },
  mage: {
    name: '마법사',
    desc: '원소의 힘으로 적을 모으고 늦추며 성을 지키는 수호자',
    trait: '넓은 범위 공격 · 체력은 약해요',
    stats: { 공격: 5, 보조: 3, 방어: 1 },
    hp: 95,
    speed: 140,
    attackCooldown: 0.75,
    skills: ['fireball', 'frostLance', 'chainLightning', 'meteor', 'whirlwind', 'iceArmor'],
    attack(state) {
      const h = state.hero
      const t = nearestEnemy(state, h.x, h.y, 320)
      if (!t) return false
      h.facing = t.x >= h.x ? 1 : -1
      spawnProjectile(state, { kind: 'bolt', x: h.x, y: h.y - 10, ...aimAt(h.x, h.y - 10, t, 400), dmg: 11, r: 6 })
    },
  },
  archer: {
    name: '궁수',
    desc: '멀리서 빠르게 화살을 쏘아 거리를 지키는 수호자',
    trait: '긴 사거리 · 빠른 공격',
    stats: { 공격: 5, 보조: 2, 방어: 2 },
    hp: 105,
    speed: 165,
    attackCooldown: 0.5,
    skills: ['multiShot', 'pierceArrow', 'arrowRain', 'poisonArrow', 'swiftStep', 'snareTrap'],
    attack(state) {
      const h = state.hero
      const t = nearestEnemy(state, h.x, h.y, 380)
      if (!t) return false
      h.facing = t.x >= h.x ? 1 : -1
      spawnProjectile(state, { kind: 'arrow', x: h.x, y: h.y - 6, ...aimAt(h.x, h.y - 6, t, 560), dmg: 9, r: 5 })
    },
  },
  builder: {
    name: '건축가',
    desc: '방벽과 포탑을 세워 전장을 설계하는 수호자',
    trait: '성 방어 특화 · 건설물이 대신 싸워요',
    stats: { 공격: 3, 보조: 4, 방어: 4 },
    hp: 125,
    speed: 145,
    attackCooldown: 0.8,
    skills: ['turret', 'barricade', 'fortify', 'landMine', 'catapult', 'repairHammer'],
    attack(state) {
      const h = state.hero
      const t = nearestEnemy(state, h.x, h.y, 260)
      if (!t) return false
      h.facing = t.x >= h.x ? 1 : -1
      spawnProjectile(state, { kind: 'hammer', x: h.x, y: h.y - 8, ...aimAt(h.x, h.y - 8, t, 360), dmg: 12, r: 8 })
    },
  },
}

export const HERO_ORDER = ['warrior', 'mage', 'archer', 'builder']
