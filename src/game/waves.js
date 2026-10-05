import { WAVES_PER_STAGE } from './constants.js'

// 망각의 군단. hp·dmg는 1단계 첫 웨이브 기준이고 웨이브가 진행될수록 커진다.
export const ENEMY_TYPES = {
  goblin: { name: '망각 고블린', hp: 22, speed: 36, dmg: 5, xp: 2, r: 13, attackRate: 1 },
  wolf: { name: '잿빛 늑대', hp: 15, speed: 68, dmg: 4, xp: 2, r: 12, attackRate: 0.8 },
  boar: { name: '철갑 멧돼지', hp: 70, speed: 28, dmg: 11, xp: 5, r: 16, attackRate: 1.2, armor: 0.2 },
  ogre: { name: '망각의 거인', hp: 520, speed: 20, dmg: 26, xp: 40, r: 28, attackRate: 1.5, armor: 0.15, boss: true },
}

export function waveScale(stage, wave) {
  return 1 + (stage - 1) * 1.0 + (wave - 1) * 0.16
}

export function spawnInterval(stage, wave) {
  return Math.max(0.35, 1.3 - wave * 0.1 - (stage - 1) * 0.15)
}

// 웨이브에 나올 적 종류 목록(나오는 순서대로).
export function buildWave(stage, wave, rng) {
  const count = 8 + wave * 3 + (stage - 1) * 7
  const list = []
  for (let i = 0; i < count; i++) {
    const roll = rng()
    if ((stage > 1 || wave >= 3) && roll < 0.12 + stage * 0.04) list.push('boar')
    else if (wave >= 2 && roll < 0.42) list.push('wolf')
    else list.push('goblin')
  }
  if (wave === WAVES_PER_STAGE) list.splice(Math.floor(list.length / 2), 0, 'ogre')
  return list
}
