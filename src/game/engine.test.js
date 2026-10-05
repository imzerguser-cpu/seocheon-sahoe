import { describe, it, expect } from 'vitest'
import {
  createGame,
  finishQuestion,
  chooseSkill,
  rollPickChoices,
  chooseCampReward,
  update,
  spawnEnemy,
  gainXp,
  damageHero,
} from './engine.js'
import { CASTLE_X, SKILL_MAX_LEVEL, SKILL_SLOT_COUNT, WAVES_PER_STAGE, STAGE_COUNT } from './constants.js'
import { HERO_CLASSES, HERO_ORDER } from './heroes.js'
import { SKILLS } from './skills.js'

function rng(seed = 42) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function newBattle(heroClass = 'mage') {
  const g = createGame({ heroClass, rng: rng() })
  finishQuestion(g, { correct: false, wrongCount: 0 })
  return g
}

function run(g, seconds, input) {
  for (let t = 0; t < seconds && g.mode === 'battle'; t += 1 / 30) update(g, 1 / 30, input)
}

describe('수호자와 스킬 정의', () => {
  it('모든 수호자의 스킬이 SKILLS에 정의되어 있다', () => {
    for (const id of HERO_ORDER) {
      for (const sk of HERO_CLASSES[id].skills) expect(SKILLS[sk], `${id}:${sk}`).toBeDefined()
    }
  })

  it('수호자마다 고를 수 있는 스킬이 슬롯 수보다 많다', () => {
    for (const id of HERO_ORDER) expect(HERO_CLASSES[id].skills.length).toBeGreaterThan(SKILL_SLOT_COUNT)
  })
})

describe('지식의 시련과 힘 선택', () => {
  it('게임은 첫 번째 문제부터 시작한다', () => {
    const g = createGame({ heroClass: 'warrior', rng: rng() })
    expect(g.mode).toBe('question')
    expect(g.questionReason).toBe('intro')
  })

  it('정답이면 힘 선택 카드 3장이 나오고, 고르면 스킬을 얻고 전투가 시작된다', () => {
    const g = createGame({ heroClass: 'warrior', rng: rng() })
    finishQuestion(g, { correct: true, wrongCount: 1 })
    expect(g.mode).toBe('pick')
    expect(g.pickChoices).toHaveLength(3)
    expect(g.stats).toMatchObject({ correct: 1, wrong: 1, stageCorrect: 1 })
    const id = g.pickChoices[0].id
    chooseSkill(g, id)
    expect(g.mode).toBe('battle')
    expect(g.skills).toEqual([expect.objectContaining({ id, level: 1 })])
  })

  it('끝까지 틀리면 힘 없이 전투로 돌아간다', () => {
    const g = createGame({ heroClass: 'warrior', rng: rng() })
    finishQuestion(g, { correct: false, wrongCount: 3 })
    expect(g.mode).toBe('battle')
    expect(g.skills).toHaveLength(0)
    expect(g.stats.wrong).toBe(3)
  })

  it('같은 스킬을 다시 고르면 레벨이 오르고 최대 레벨을 넘지 않는다', () => {
    const g = newBattle('archer')
    for (let i = 0; i < SKILL_MAX_LEVEL + 2; i++) chooseSkill(g, 'multiShot')
    expect(g.skills).toEqual([expect.objectContaining({ id: 'multiShot', level: SKILL_MAX_LEVEL })])
  })

  it('슬롯이 가득 차면 새 스킬 대신 가진 스킬의 강화만 나온다', () => {
    const g = newBattle('builder')
    const owned = HERO_CLASSES.builder.skills.slice(0, SKILL_SLOT_COUNT)
    owned.forEach((id) => chooseSkill(g, id))
    for (let i = 0; i < 10; i++) {
      for (const c of rollPickChoices(g)) {
        expect(owned).toContain(c.id)
        expect(c.from).toBeGreaterThan(0)
      }
    }
  })

  it('모든 스킬이 최대 레벨이면 회복 카드가 나온다', () => {
    const g = newBattle('builder')
    g.skills = HERO_CLASSES.builder.skills.slice(0, SKILL_SLOT_COUNT).map((id) => ({ id, level: SKILL_MAX_LEVEL, timer: 0 }))
    g.castle.hp = 100
    expect(rollPickChoices(g)).toEqual([{ id: 'recover', from: 0, to: 0 }])
    chooseSkill(g, 'recover')
    expect(g.castle.hp).toBeGreaterThan(100)
  })
})

describe('전투 진행', () => {
  it('적이 오른쪽에서 나타나 성 쪽으로 걸어온다', () => {
    const g = newBattle()
    run(g, 3)
    expect(g.wave).toBe(1)
    expect(g.enemies.length).toBeGreaterThan(0)
    const e = g.enemies[0]
    const x0 = e.x
    g.hero.x = CASTLE_X + 20
    g.hero.y = 130
    e.y = 500
    update(g, 0.03)
    expect(e.x).toBeLessThan(x0)
  })

  it('성벽에 닿은 적은 성을 공격한다', () => {
    const g = newBattle()
    g.hero.dead = true
    g.hero.respawn = 999
    const e = spawnEnemy(g, 'goblin', { x: CASTLE_X + 5, y: 300 })
    e.atkTimer = 0
    const before = g.castle.hp
    update(g, 0.02)
    expect(g.castle.hp).toBeLessThan(before)
  })

  it('성 내구도가 0이 되면 패배한다', () => {
    const g = newBattle()
    g.castle.hp = 1
    g.hero.dead = true
    g.hero.respawn = 999
    const e = spawnEnemy(g, 'ogre', { x: CASTLE_X + 5, y: 300 })
    e.atkTimer = 0
    update(g, 0.02)
    expect(g.mode).toBe('defeat')
  })

  it('수호자가 쓰러지면 잠시 뒤 성 앞에서 다시 일어난다', () => {
    const g = newBattle('warrior')
    damageHero(g, 9999)
    expect(g.hero.dead).toBe(true)
    run(g, 6)
    expect(g.hero.dead).toBe(false)
    expect(g.hero.hp).toBe(g.hero.maxHp)
  })

  it('경험치가 차면 전투가 멈추고 성장의 기회 문제가 나온다', () => {
    const g = newBattle()
    gainXp(g, g.xpNext)
    expect(g.level).toBe(1)
    update(g, 0.02)
    expect(g.mode).toBe('question')
    expect(g.questionReason).toBe('levelup')
  })

  it('기본 공격만으로도 가까운 적을 물리친다', () => {
    for (const id of HERO_ORDER) {
      const g = newBattle(id)
      g.hero.x = 400
      g.hero.y = 300
      spawnEnemy(g, 'goblin', { x: 440, y: 300 })
      g.spawnQueue = []
      g.waveDelay = 999
      run(g, 6)
      expect(g.stats.kills, id).toBeGreaterThanOrEqual(1)
    }
  })

  it('한 전장의 마지막 웨이브를 막으면 야영지 보상을 고르고 다음 전장으로 간다', () => {
    const g = newBattle()
    g.wave = WAVES_PER_STAGE
    g.spawnQueue = []
    g.enemies = []
    g.stats.stageCorrect = 2
    update(g, 0.02)
    expect(g.mode).toBe('camp')
    const attack = g.campRewards.find((r) => r.target === 'attack')
    expect(attack.correct).toBe(2)
    chooseCampReward(g, 'attack')
    expect(g.mode).toBe('battle')
    expect(g.stage).toBe(2)
    expect(g.wave).toBe(0)
    expect(g.attackBonus).toBeCloseTo(attack.percent / 100)
    expect(g.stats.stageCorrect).toBe(0)
  })

  it('성벽 회복 보상은 성 내구도를 채운다', () => {
    const g = newBattle()
    g.wave = WAVES_PER_STAGE
    g.castle.hp = 500
    update(g, 0.02)
    const heal = g.campRewards.find((r) => r.target === 'castle')
    chooseCampReward(g, 'castle')
    expect(Math.round(g.castle.hp)).toBe(heal.after)
  })

  it('마지막 전장까지 지키면 승리한다', () => {
    const g = newBattle()
    g.stage = STAGE_COUNT
    g.wave = WAVES_PER_STAGE
    update(g, 0.02)
    expect(g.mode).toBe('victory')
  })

  it('모든 스킬이 오류 없이 발동한다', () => {
    for (const heroId of HERO_ORDER) {
      const g = newBattle(heroId)
      g.skills = HERO_CLASSES[heroId].skills.map((id) => ({ id, level: 3, timer: 0 }))
      g.hero.x = 380
      g.hero.y = 300
      for (let i = 0; i < 12; i++) spawnEnemy(g, i % 3 ? 'goblin' : 'boar', { x: 420 + i * 12, y: 280 + (i % 4) * 12 })
      expect(() => run(g, 8)).not.toThrow()
      expect(g.stats.kills, heroId).toBeGreaterThan(0)
    }
  })
})
