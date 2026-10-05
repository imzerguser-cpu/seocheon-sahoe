import { SKILLS } from '../../game/skills.js'
import { STAGES } from '../../game/constants.js'

// 힘(스킬) 선택 카드 3장.
export function SkillPickPanel({ choices, onPick }) {
  return (
    <div className="game-modal pick-panel" role="dialog" aria-label="새로운 힘 선택">
      <p className="game-modal-kicker">LEVEL UP</p>
      <h2>새로운 힘을 선택하세요</h2>
      <p className="game-pause-note">하나를 골라 나만의 수호자를 완성해요.</p>
      <div className="pick-grid">
        {choices.map((c) => {
          if (c.id === 'recover') {
            return (
              <button key="recover" type="button" className="pick-card" onClick={() => onPick('recover')}>
                <span className="pick-kind">보조</span>
                <span className="pick-icon" aria-hidden="true">💖</span>
                <strong className="pick-name">기운 회복</strong>
                <span className="pick-desc">모든 힘을 다 익혔어요! 수호자와 성벽을 회복해요.</span>
                <span className="pick-level">회복</span>
                <span className="pick-action">선택하기</span>
              </button>
            )
          }
          const def = SKILLS[c.id]
          return (
            <button key={c.id} type="button" className="pick-card" onClick={() => onPick(c.id)}>
              <span className="pick-kind">{def.kind}</span>
              <span className="pick-icon" aria-hidden="true">{def.icon}</span>
              <strong className="pick-name">{def.name}</strong>
              <span className="pick-desc">{def.desc}</span>
              <span className="pick-level">{c.from === 0 ? '새 스킬 · Lv.1' : `Lv.${c.from} → Lv.${c.to}`}</span>
              <span className="pick-action">선택하기</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// 전장과 전장 사이 야영지: 공격력 강화와 성벽 회복 중 하나를 고른다.
export function CampPanel({ stage, rewards, onPick }) {
  const next = STAGES[stage]?.name
  return (
    <div className="game-modal camp-panel" role="dialog" aria-label="야영지 보상">
      <p className="game-modal-kicker">STAGE {stage} CLEAR</p>
      <h2>전장을 지켜 냈어요!</h2>
      <p className="game-pause-note">
        보상을 <b>하나</b> 고르고 다음 전장 「{next}」에서 다시 싸워요.
      </p>
      {rewards[0].correct === 0 && (
        <p className="camp-note">이번 전장에서 맞힌 문제가 없어서 기본 보상만 받아요.</p>
      )}
      <div className="camp-grid">
        {rewards.map((r) => (
          <button key={r.target} type="button" className={`camp-card ${r.target}`} onClick={() => onPick(r.target)}>
            <span className="camp-icon" aria-hidden="true">{r.target === 'attack' ? '⚔️' : '🏰'}</span>
            <strong>{r.target === 'attack' ? `공격력 +${r.percent}%` : `성벽 ${r.percent}% 회복`}</strong>
            {r.target === 'attack' ? (
              <span>남은 전투 내내 모든 공격이 강해져요.</span>
            ) : (
              <span>
                {r.current} → <b>{r.after}</b> / {r.max}
                {r.current >= r.max ? ' (이미 가득 찼어요)' : ''}
              </span>
            )}
            <span className="camp-basis">이번 전장 정답 {r.correct}개 기준</span>
            <span className="pick-action">이 보상 선택 · 다음 전장으로</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function ResultPanel({ victory, state, onRetry, onExit }) {
  const { stats } = state
  const total = stats.correct + stats.wrong
  return (
    <div className="game-modal result-panel" role="dialog" aria-label={victory ? '승리' : '패배'}>
      <p className="game-modal-kicker">{victory ? 'VICTORY' : 'DEFEAT'}</p>
      <h2>{victory ? '지식의 성을 지켜 냈어요!' : '성문이 무너졌어요…'}</h2>
      <p className="game-pause-note">
        {victory
          ? '망각의 군단이 물러갔어요. 훌륭한 수호자예요!'
          : '문제를 맞히면 더 강한 힘을 얻을 수 있어요. 다시 도전해 볼까요?'}
      </p>
      <dl className="result-stats">
        <div>
          <dt>맞힌 문제</dt>
          <dd>
            {stats.correct} / {total}
          </dd>
        </div>
        <div>
          <dt>물리친 적</dt>
          <dd>{stats.kills}</dd>
        </div>
        <div>
          <dt>도달한 곳</dt>
          <dd>
            {state.stage}전장 · {Math.max(1, state.wave)}웨이브
          </dd>
        </div>
        <div>
          <dt>수호자 레벨</dt>
          <dd>Lv.{state.level}</dd>
        </div>
      </dl>
      <div className="result-actions">
        <button type="button" className="game-primary" onClick={onRetry}>
          다시 도전
        </button>
        <button type="button" className="game-secondary" onClick={onExit}>
          미션 선택으로
        </button>
      </div>
    </div>
  )
}
