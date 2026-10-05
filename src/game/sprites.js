// 직접 그린 픽셀 아트. 문자 하나가 픽셀 하나이고 '.'은 투명이다.
// 모두 오른쪽을 바라보는 모습이며, 왼쪽을 볼 때는 좌우로 뒤집어 그린다.

const SHARED = {
  k: '#1d1a2e',
  s: '#f6cda4',
  S: '#dc9f78',
  w: '#ffffff',
  r: '#e0524a',
}

const HEAD_HAIR = [
  '.....kkkkkk.....',
  '....kHHHHHHk....',
  '...kHHhHHhHHk...',
  '...kHhhhhhhHk...',
  '...khhsssshhk...',
  '...khsssssssk...',
  '...ksskssksSk...',
  '...kssssssSSk...',
  '....kSsrrsSk....',
  '.....kkkkkk.....',
]

const LEGS_A = ['....kLLkkLLk....', '....kLLk.kLLk...', '....kkk...kkk...']
const LEGS_B = ['....kLLkkLLk....', '...kLLk..kLLk...', '...kkk....kkk...']

function heroSprite(head, body, palette) {
  return {
    palette: { ...SHARED, ...palette },
    frames: [
      [...head, ...body, ...LEGS_A],
      [...head, ...body, ...LEGS_B],
    ],
  }
}

export const SPRITES = {
  warrior: heroSprite(
    HEAD_HAIR,
    [
      '..bbkaaaaaak..w.',
      '.bbbkaAggAak.ww.',
      '.bBbkaAggAakkwk.',
      '.bBbkaaaaaakgggk',
      '.bbbkkaaaakkskk.',
      '..bbkAAAAAAk....',
      '...bkaaAAaak....',
    ],
    { H: '#c6772f', h: '#8a4a1c', a: '#d3dbe8', A: '#97a3b8', g: '#f0c04a', b: '#2f5fc0', B: '#1f3f8a', L: '#5a6a85' },
  ),
  mage: heroSprite(
    [
      '.......kk.......',
      '......kbbk......',
      '.....kbbbbk..o..',
      '....kbbgbbbk.oo.',
      '..kkkkkkkkkkkkn.',
      '...khhsssshhk.n.',
      '...khsssssssk.n.',
      '...ksskssksSk.n.',
      '....kSsrrsSk..n.',
      '.....kkkkkk...n.',
    ],
    [
      '....kbbbbbbk..n.',
      '...kbbgbbgbbksn.',
      '...kbbbggbbbkkn.',
      '...kbBbggbBbk.n.',
      '..kbbBbggbBbbkn.',
      '..kbBBbggbBBbk..',
      '..kkbbbbbbbbkk..',
    ],
    { H: '#c6772f', h: '#8a4a1c', b: '#3550b8', B: '#22357f', g: '#f0c04a', o: '#ffb340', n: '#7a4b26', L: '#3a2a55' },
  ),
  archer: heroSprite(
    [
      '.....kkkkkk.....',
      '....kGGGGGGk....',
      '...kGGgGGgGGk...',
      '..kGGhhhhhhGGk..',
      '..kGhhsssshhGk..',
      '..kGhsssssssk...',
      '..kGsskssksSk...',
      '...kssssssSSk...',
      '....kSsrrsSk....',
      '.....kkkkkk.....',
    ],
    [
      '...kGggggggk.n..',
      '..kGgnggnggk.nn.',
      '..kGggnnggkks.n.',
      '..kGgggnggk.n.n.',
      '...kggggggk.nn..',
      '...knnnnnnk.n...',
      '...kggggggk.....',
    ],
    { H: '#c6772f', h: '#b0521f', G: '#2f7d3a', g: '#4fa64a', n: '#8a5a2b', L: '#4a3a2a' },
  ),
  builder: heroSprite(
    HEAD_HAIR,
    [
      '...kvvvvvvk.....',
      '..kcvccccvck.mm.',
      '..kcvccccvckkmm.',
      '..kcvyyyyvcksnk.',
      '..kkvccccvkk.n..',
      '...kvvvvvvk..n..',
      '...kccccccck....',
    ],
    { H: '#d9692f', h: '#a3461c', v: '#8a5a2b', c: '#3b6fb6', y: '#f0c04a', m: '#8d97a8', n: '#6b4423', L: '#4a3a2a' },
  ),

  goblin: {
    palette: { ...SHARED, g: '#6fae3f', G: '#4b7f2a', e: '#ffdf3d', c: '#7a4b2a', d: '#c9d1dc' },
    frames: [
      [
        '..kk.....kk...',
        '.kgGk...kGgk..',
        '.kggkkkkkggk..',
        '..kggggggggk..',
        '..kgekggekgk..',
        '..kggggggggk..',
        '...kgkwwkgk...',
        '...kkccccck.d.',
        '..kgkccccckdk.',
        '..kgkccccckk..',
        '...kkGGGGkk...',
        '...kgk..kgk...',
        '...kkk..kkk...',
      ],
      [
        '..kk.....kk...',
        '.kgGk...kGgk..',
        '.kggkkkkkggk..',
        '..kggggggggk..',
        '..kgekggekgk..',
        '..kggggggggk..',
        '...kgkwwkgk...',
        '...kkccccck.d.',
        '..kgkccccckdk.',
        '..kgkccccckk..',
        '...kkGGGGkk...',
        '..kgk....kgk..',
        '..kkk....kkk..',
      ],
    ],
  },
  wolf: {
    palette: { ...SHARED, f: '#8d93a3', F: '#626879', e: '#ff5d4a' },
    frames: [
      [
        'kk..............',
        'kfk.......kkk...',
        'kffkkkkkkkfffk..',
        '.kfffffffffFfekk',
        '.kfffffffffffffk',
        '.kFfffffffFfkwk.',
        '..kFkkkkkkFkk...',
        '..kfk....kfk....',
        '..kkk....kkk....',
      ],
      [
        'kk..............',
        'kfk.......kkk...',
        'kffkkkkkkkfffk..',
        '.kfffffffffFfekk',
        '.kfffffffffffffk',
        '.kFfffffffFfkwk.',
        '..kFkkkkkkFkk...',
        '.kfk......kfk...',
        '.kkk......kkk...',
      ],
    ],
  },
  boar: {
    palette: { ...SHARED, b: '#9a5a32', B: '#6e3c1f', o: '#e3772f', O: '#b2541c', e: '#ffdf3d', t: '#f3ead2' },
    frames: [
      [
        '....kkkkkkkkk.......',
        '...kOoOoOoOoOkk.....',
        '..kooOoOoOoOoook....',
        '.kbbbbbbbbbbbbobkk..',
        '.kbbbbbbbbbbbbbbbek.',
        '.kbbbbbbbbbbbbbbbbbk',
        '.kBbbbbbbbbbbbbbbtbk',
        '..kBBBBBBBBBBBBkkttk',
        '..kbk.kbk..kbk.kbk..',
        '..kkk.kkk..kkk.kkk..',
      ],
      [
        '....kkkkkkkkk.......',
        '...kOoOoOoOoOkk.....',
        '..kooOoOoOoOoook....',
        '.kbbbbbbbbbbbbobkk..',
        '.kbbbbbbbbbbbbbbbek.',
        '.kbbbbbbbbbbbbbbbbbk',
        '.kBbbbbbbbbbbbbbbtbk',
        '..kBBBBBBBBBBBBkkttk',
        '.kbk..kbk.kbk..kbk..',
        '.kkk..kkk.kkk..kkk..',
      ],
    ],
  },
  ogre: {
    palette: { ...SHARED, p: '#8b6bb8', P: '#5f4589', e: '#ffdf3d', c: '#6b4423', C: '#4a2d16', t: '#f3ead2', m: '#9aa3b5' },
    frames: [
      [
        '.......kkkkkk.........',
        '......kppppppk........',
        '.....kppppppppk.......',
        '.....kpekppekpk.......',
        '.....kppppppppk..mm...',
        '.....kptkkkktpk.mmmm..',
        '......kppppppk..kmmk..',
        '...kkkkkkkkkkkkk.kk...',
        '..kpppcccccccpppk.k...',
        '.kppkpcccccccpkppkk...',
        '.kpk.kcCCCCCck.kpk....',
        '.kpk.kcccccccck.kk....',
        '.kkk.kcccccccck.......',
        '.....kPPPPPPPPk.......',
        '.....kPPk..kPPk.......',
        '.....kppk..kppk.......',
        '.....kkkk..kkkk.......',
      ],
      [
        '.......kkkkkk.........',
        '......kppppppk........',
        '.....kppppppppk.......',
        '.....kpekppekpk.......',
        '.....kppppppppk..mm...',
        '.....kptkkkktpk.mmmm..',
        '......kppppppk..kmmk..',
        '...kkkkkkkkkkkkk.kk...',
        '..kpppcccccccpppk.k...',
        '.kppkpcccccccpkppkk...',
        '.kpk.kcCCCCCck.kpk....',
        '.kpk.kcccccccck.kk....',
        '.kkk.kcccccccck.......',
        '.....kPPPPPPPPk.......',
        '....kPPk....kPPk......',
        '....kppk....kppk......',
        '....kkkk....kkkk......',
      ],
    ],
  },
}

// 스프라이트를 미리 오프스크린 캔버스로 구워 둔다(매 프레임 픽셀을 찍지 않도록).
const cache = new Map()

export function spriteCanvas(name, frame = 0, flash = false) {
  const key = `${name}:${frame}:${flash ? 1 : 0}`
  if (cache.has(key)) return cache.get(key)
  const def = SPRITES[name]
  const rows = def.frames[frame % def.frames.length]
  const h = rows.length
  const w = Math.max(...rows.map((r) => r.length))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x]
        if (ch === '.' || ch === ' ') continue
        const color = def.palette[ch]
        if (!color) continue
        ctx.fillStyle = flash && ch !== 'k' ? '#ffffff' : color
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
  cache.set(key, canvas)
  return canvas
}

export function spriteSize(name) {
  const rows = SPRITES[name].frames[0]
  return { w: Math.max(...rows.map((r) => r.length)), h: rows.length }
}
