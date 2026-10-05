// 게임 화면은 960x540 논리 좌표로 계산하고, 캔버스를 화면 크기에 맞춰 늘려서 그린다.
export const WORLD_W = 960
export const WORLD_H = 540

// 왼쪽 성벽이 차지하는 영역의 오른쪽 끝. 적은 이 선에 닿으면 성을 공격한다.
export const CASTLE_X = 132
// HORIZON은 배경의 하늘과 들판 경계, FIELD_TOP~FIELD_BOTTOM은 캐릭터가 설 수 있는 범위.
// 위쪽 HUD에 캐릭터가 가리지 않도록 FIELD_TOP을 지평선보다 조금 아래로 둔다.
export const HORIZON = 96
export const FIELD_TOP = 132
export const FIELD_BOTTOM = 516

export const HERO_RADIUS = 14
export const SKILL_SLOT_COUNT = 5
export const SKILL_MAX_LEVEL = 5

export const STAGE_COUNT = 3
export const WAVES_PER_STAGE = 6

// 한 번의 "지식의 시련"에서 틀려도 다시 도전할 수 있는 횟수.
export const QUESTION_ATTEMPTS = 3

export const STAGES = [
  { name: '신성리 갈대밭', sky: '#f7d9a0', grass: '#9fbf5a', grassDark: '#7f9f43', dirt: '#c9a86a' },
  { name: '장항 송림', sky: '#b9dcc2', grass: '#5f9f4f', grassDark: '#477f3b', dirt: '#a88c5c' },
  { name: '금강 하굿둑', sky: '#9fb8e0', grass: '#6a8f63', grassDark: '#52734c', dirt: '#93876a' },
]

export function xpForLevel(level) {
  return 24 + level * 10
}
