import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getUnits } from '../lib/dataLoader.js'
import { fetchAllQuestions } from '../lib/quizzesRepo.js'
import { selectVisibleQuestionsForScope } from '../lib/quizVisibility.js'
import { fetchGameSettings, isGameEnabled } from '../lib/gameSettingsRepo.js'
import { toGameQuestions } from '../game/questions.js'
import { HERO_CLASSES, HERO_ORDER } from '../game/heroes.js'
import { STAGE_COUNT } from '../game/constants.js'
import SpriteImage from '../components/game/SpriteImage.jsx'
import BattleScreen from '../components/game/BattleScreen.jsx'
import '../styles/game.css'

const SEMESTER_LABEL = { 1: '1학기', 2: '2학기' }

export default function GamePage() {
  const { publisherId } = useParams()
  const { session } = useAuth()
  const [status, setStatus] = useState('loading') // loading | error | hidden | ready
  const [allQuizzes, setAllQuizzes] = useState([])
  const [step, setStep] = useState('mission') // mission | hero | battle
  const [unitId, setUnitId] = useState(null)
  const [heroClass, setHeroClass] = useState('warrior')

  useEffect(() => {
    if (!session) return
    let cancelled = false
    Promise.all([fetchGameSettings(), fetchAllQuestions()])
      .then(([settings, quizzes]) => {
        if (cancelled) return
        if (!isGameEnabled(settings, session.schoolId)) {
          setStatus('hidden')
          return
        }
        setAllQuizzes(quizzes)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [session])

  const missions = useMemo(
    () =>
      getUnits(publisherId).map((unit) => ({
        unit,
        questions: toGameQuestions(
          selectVisibleQuestionsForScope(allQuizzes, { publisherId, scope: 'unit', refId: unit.id }),
        ),
      })),
    [allQuizzes, publisherId],
  )

  if (!session) return <Navigate to="/login" replace />

  const backLink = (
    <Link to={`/p/${publisherId}`} className="game-back">
      ← 단원 목록으로
    </Link>
  )

  if (status === 'loading') {
    return (
      <div className="game-shell">
        <p className="game-loading">성문을 준비하고 있어요…</p>
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="game-shell">
        {backLink}
        <p className="game-loading">게임을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      </div>
    )
  }
  if (status === 'hidden') {
    return (
      <div className="game-shell">
        {backLink}
        <p className="game-loading">아직 선생님이 게임을 열지 않았어요.</p>
      </div>
    )
  }

  const mission = missions.find((m) => m.unit.id === unitId)

  if (step === 'battle' && mission) {
    return (
      <div className="game-shell battle">
        <BattleScreen
          questions={mission.questions}
          heroClass={heroClass}
          missionTitle={mission.unit.title}
          onExit={() => setStep('mission')}
        />
      </div>
    )
  }

  if (step === 'hero' && mission) {
    return (
      <div className="game-shell">
        <button type="button" className="game-back" onClick={() => setStep('mission')}>
          ← 미션으로
        </button>
        <header className="game-hero-head">
          <p className="game-eyebrow">CHOOSE YOUR GUARDIAN</p>
          <h1>성의 수호자를 선택하세요</h1>
          <p className="game-mission-chip">
            {SEMESTER_LABEL[mission.unit.semester]} · <b>{mission.unit.title}</b>
          </p>
        </header>
        <div className="hero-grid" role="radiogroup" aria-label="수호자">
          {HERO_ORDER.map((id) => {
            const c = HERO_CLASSES[id]
            const selected = heroClass === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`hero-card ${selected ? 'selected' : ''}`}
                onClick={() => setHeroClass(id)}
              >
                <span className="hero-tag">{selected ? '선택한 수호자' : '함께할 수호자'}</span>
                <SpriteImage name={id} scale={6} className="hero-portrait" />
                <strong className="hero-name">{c.name}</strong>
                <span className="hero-desc">{c.desc}</span>
                <span className="hero-stats">
                  {Object.entries(c.stats).map(([k, v]) => (
                    <span key={k}>
                      {k} {v}
                    </span>
                  ))}
                </span>
                <span className="hero-trait">{c.trait}</span>
              </button>
            )
          })}
        </div>
        <p className="game-howto">방향키·WASD, 조이스틱 또는 전장을 눌러 이동 · 공격은 자동으로</p>
        <button type="button" className="game-primary game-start" onClick={() => setStep('battle')}>
          성 지키러 출발
        </button>
      </div>
    )
  }

  return (
    <div className="game-shell">
      {backLink}
      <header className="game-title">
        <p className="game-eyebrow">THE KEEPERS OF KNOWLEDGE</p>
        <h1>지식의 성</h1>
        <p>
          망각의 군단이 다가와요. 문제를 맞혀 힘을 깨우고, 성을 지켜 주세요.
          <br />
          {session.studentName} 수호자님, 어떤 단원에 도전할까요?
        </p>
      </header>
      <ul className="mission-grid">
        {missions.map(({ unit, questions }) => (
          <li key={unit.id}>
            <div className={`mission-card ${questions.length === 0 ? 'locked' : ''}`}>
              <span className="mission-meta">
                {SEMESTER_LABEL[unit.semester]} · 사회
              </span>
              <strong className="mission-name">{unit.title}</strong>
              <span className="mission-count">
                {questions.length > 0
                  ? `${questions.length}문항 · ${STAGE_COUNT}개 전장`
                  : '아직 게임에 쓸 퀴즈가 없어요'}
              </span>
              <button
                type="button"
                className="game-primary"
                disabled={questions.length === 0}
                aria-label={`${unit.title} 출전 준비`}
                onClick={() => {
                  setUnitId(unit.id)
                  setStep('hero')
                }}
              >
                출전 준비
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
