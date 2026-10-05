import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SKILL_SLOT_COUNT, STAGES, WAVES_PER_STAGE, WORLD_H, WORLD_W } from '../../game/constants.js'
import { chooseCampReward, chooseSkill, createGame, finishQuestion, update } from '../../game/engine.js'
import { HERO_CLASSES } from '../../game/heroes.js'
import { createQuestionDeck } from '../../game/questions.js'
import { drawGame, screenToWorld } from '../../game/render.js'
import { SKILLS } from '../../game/skills.js'
import QuestionPanel from './QuestionPanel.jsx'
import { CampPanel, ResultPanel, SkillPickPanel } from './Panels.jsx'

const MOVE_KEYS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  a: [-1, 0],
  d: [1, 0],
  w: [0, -1],
  s: [0, 1],
}

export default function BattleScreen(props) {
  // 다시 도전하면 key를 바꿔 전투 상태를 통째로 새로 만든다.
  const [runId, setRunId] = useState(0)
  return <Battle key={runId} {...props} onRetry={() => setRunId((n) => n + 1)} />
}

function Battle({ questions, heroClass, missionTitle, onExit, onRetry }) {
  const stateRef = useRef(null)
  if (!stateRef.current) stateRef.current = createGame({ heroClass })
  const state = stateRef.current
  const deck = useMemo(() => createQuestionDeck(questions), [questions])

  const canvasRef = useRef(null)
  const frameRef = useRef(null)
  const [, setTick] = useState(0)
  const rerender = useCallback(() => setTick((t) => t + 1), [])
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  pausedRef.current = paused
  const [showDamage, setShowDamage] = useState(true)
  const showDamageRef = useRef(true)
  showDamageRef.current = showDamage
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 })
  const input = useRef({ keys: new Set(), joy: null, target: null, pointerId: null })

  // ── 게임 루프 ──
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext?.('2d')
    let raf = 0
    let last = performance.now()
    let lastMode = state.mode
    let hudTimer = 0

    function readInput() {
      const inp = input.current
      if (inp.joy) return { dx: inp.joy.x, dy: inp.joy.y }
      let dx = 0
      let dy = 0
      for (const k of inp.keys) {
        const v = MOVE_KEYS[k]
        if (v) {
          dx += v[0]
          dy += v[1]
        }
      }
      if (dx || dy) {
        inp.target = null
        return { dx, dy }
      }
      if (inp.target) {
        const h = state.hero
        if (Math.hypot(inp.target.x - h.x, inp.target.y - h.y) < 8 && inp.pointerId === null) inp.target = null
        return { target: inp.target }
      }
      return {}
    }

    function frame(now) {
      const dt = (now - last) / 1000
      last = now
      if (!pausedRef.current) update(state, dt, readInput())
      if (ctx) drawGame(ctx, state, { showDamage: showDamageRef.current })
      hudTimer += dt
      if (state.mode !== lastMode || hudTimer > 0.12) {
        lastMode = state.mode
        hudTimer = 0
        rerender()
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [state, rerender])

  // ── 키보드 ──
  useEffect(() => {
    const keys = input.current.keys
    function down(e) {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (MOVE_KEYS[k] && state.mode === 'battle') {
        keys.add(k)
        e.preventDefault()
      }
      if ((k === 'Escape' || k === 'p') && state.mode === 'battle') setPaused((p) => !p)
    }
    function up(e) {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      keys.delete(k)
    }
    function blur() {
      keys.clear()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [state])

  // ── 전장 터치/클릭으로 이동 ──
  function onFieldDown(e) {
    if (state.mode !== 'battle' || paused) return
    const inp = input.current
    inp.pointerId = e.pointerId
    inp.target = screenToWorld(canvasRef.current, e.clientX, e.clientY)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  function onFieldMove(e) {
    const inp = input.current
    if (inp.pointerId !== e.pointerId) return
    inp.target = screenToWorld(canvasRef.current, e.clientX, e.clientY)
  }
  function onFieldUp(e) {
    if (input.current.pointerId === e.pointerId) input.current.pointerId = null
  }

  // ── 가상 조이스틱 ──
  const joyBase = useRef(null)
  function joyUpdate(e) {
    const rect = joyBase.current.getBoundingClientRect()
    // 조이스틱 크기가 화면 폭에 따라 달라지므로 손잡이 이동 반경도 그에 맞춘다.
    const radius = rect.width * 0.42
    let x = e.clientX - (rect.left + rect.width / 2)
    let y = e.clientY - (rect.top + rect.height / 2)
    const len = Math.hypot(x, y)
    if (len > radius) {
      x = (x / len) * radius
      y = (y / len) * radius
    }
    input.current.joy = { x: x / radius, y: y / radius }
    input.current.target = null
    setJoyKnob({ x, y })
  }
  function onJoyDown(e) {
    if (state.mode !== 'battle' || paused) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    joyUpdate(e)
  }
  function onJoyMove(e) {
    if (input.current.joy) joyUpdate(e)
  }
  function onJoyUp() {
    input.current.joy = null
    setJoyKnob({ x: 0, y: 0 })
  }

  function toggleFullscreen() {
    const el = frameRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen?.()
    else el.requestFullscreen?.()
  }

  function handleQuestionDone(result) {
    finishQuestion(state, result)
    rerender()
  }
  function handlePick(id) {
    chooseSkill(state, id)
    rerender()
  }
  function handleCamp(target) {
    chooseCampReward(state, target)
    rerender()
  }

  const h = state.hero
  const castle = state.castle
  const cls = HERO_CLASSES[h.cls]
  const stageInfo = STAGES[state.stage - 1]
  const questionKey = `${state.level}-${state.stats.correct}-${state.stats.wrong}`
  const questionTitle = state.questionReason === 'intro' ? '첫 번째 지식' : '성장의 기회'

  return (
    <div className="battle-frame" ref={frameRef}>
      <div className="battle-stage">
        <canvas
          ref={canvasRef}
          width={WORLD_W}
          height={WORLD_H}
          className="battle-canvas"
          aria-label="전장"
          onPointerDown={onFieldDown}
          onPointerMove={onFieldMove}
          onPointerUp={onFieldUp}
          onPointerCancel={onFieldUp}
        />

        <div className="hud-top">
          <div className="hud-panel hud-hero">
            <div className="hud-row">
              <span>♥ {cls.name}</span>
              <b>Lv.{state.level}</b>
            </div>
            <div className="hud-bar">
              <i style={{ width: `${(h.hp / h.maxHp) * 100}%` }} className="hp" />
            </div>
            <div className="hud-sub">
              {h.dead ? `회복 중 ${Math.ceil(h.respawn)}초` : `${Math.ceil(h.hp)} / ${h.maxHp}`}
              {h.maxShield > 0 && ` · 보호막 ${Math.ceil(h.shield)}`}
            </div>
          </div>
          <div className="hud-panel hud-stage">
            <b>STAGE {state.stage}</b>
            <span>
              {stageInfo.name} · {Math.max(1, state.wave)}/{WAVES_PER_STAGE} 웨이브
            </span>
          </div>
          <div className="hud-panel hud-castle">
            <div className="hud-row">
              <span>🏰 성 내구도</span>
            </div>
            <div className="hud-bar">
              <i style={{ width: `${(castle.hp / castle.maxHp) * 100}%` }} className="castle" />
            </div>
            <div className="hud-sub">
              {Math.ceil(castle.hp)} / {castle.maxHp}
              {state.time - castle.hitTime < 0.6 ? ' · 공격받는 중' : ''}
            </div>
          </div>
        </div>

        <div className="hud-tools">
          <button
            type="button"
            className={`hud-icon ${showDamage ? 'active' : ''}`}
            aria-pressed={showDamage}
            aria-label="피해 숫자 표시"
            title="피해 숫자 표시"
            onClick={() => setShowDamage((v) => !v)}
          >
            123
          </button>
          <button type="button" className="hud-icon" aria-label="전체 화면" title="전체 화면" onClick={toggleFullscreen}>
            ⛶
          </button>
          <button
            type="button"
            className="hud-icon"
            aria-label="일시정지"
            title="일시정지"
            disabled={state.mode !== 'battle'}
            onClick={() => setPaused(true)}
          >
            ❚❚
          </button>
        </div>

        <div
          className="joystick"
          ref={joyBase}
          onPointerDown={onJoyDown}
          onPointerMove={onJoyMove}
          onPointerUp={onJoyUp}
          onPointerCancel={onJoyUp}
          aria-label="이동 조이스틱"
        >
          <span className="joystick-knob" style={{ transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)` }} />
          <span className="joystick-label">이동</span>
        </div>

        {state.mode !== 'battle' && <div className="battle-dim" />}
        {state.mode === 'question' && (
          <QuestionPanel key={questionKey} deck={deck} title={questionTitle} onDone={handleQuestionDone} />
        )}
        {state.mode === 'pick' && <SkillPickPanel choices={state.pickChoices} onPick={handlePick} />}
        {state.mode === 'camp' && <CampPanel stage={state.stage} rewards={state.campRewards} onPick={handleCamp} />}
        {(state.mode === 'victory' || state.mode === 'defeat') && (
          <ResultPanel victory={state.mode === 'victory'} state={state} onRetry={onRetry} onExit={onExit} />
        )}
        {paused && state.mode === 'battle' && (
          <div className="game-modal pause-panel" role="dialog" aria-label="일시정지">
            <h2>잠시 쉬어 가요</h2>
            <p className="game-pause-note">{missionTitle}</p>
            <div className="result-actions">
              <button type="button" className="game-primary" onClick={() => setPaused(false)} autoFocus>
                계속하기
              </button>
              <button type="button" className="game-secondary" onClick={onExit}>
                미션 선택으로 나가기
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="battle-bottom">
        <div className="xp-row">
          <span>성장 경험치 {state.xp}/{state.xpNext}</span>
          <div className="xp-bar">
            <i style={{ width: `${(state.xp / state.xpNext) * 100}%` }} />
          </div>
          <span>정답 {state.stats.correct}</span>
        </div>
        <ul className="skill-slots">
          {Array.from({ length: SKILL_SLOT_COUNT }, (_, i) => {
            const sk = state.skills[i]
            if (!sk) {
              return (
                <li key={i} className="skill-slot empty">
                  아직 잠든 힘
                </li>
              )
            }
            const def = SKILLS[sk.id]
            return (
              <li key={i} className="skill-slot" title={def.desc}>
                <span aria-hidden="true">{def.icon}</span> {def.name} <b>Lv.{sk.level}</b>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
