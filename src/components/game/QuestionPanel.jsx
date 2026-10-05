import { useEffect, useState, useCallback } from 'react'
import { QUESTION_ATTEMPTS } from '../../game/constants.js'

const READ_DELAY_MS = 900
const WRONG_DELAY_MS = 1800
const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥']

// 받침이 있으면 '이에요', 없으면 '예요'.
function ieyo(word) {
  const code = word.trim().slice(-1).charCodeAt(0) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? '이에요' : '예요'
}

// "지식의 시련" 한 번. 맞히면 onDone({correct:true}), QUESTION_ATTEMPTS번 모두
// 틀리면 onDone({correct:false}). 틀릴 때마다 정답을 보여 주고 새 문제를 낸다.
export default function QuestionPanel({ deck, title, onDone }) {
  const [question, setQuestion] = useState(() => deck.next())
  const [wrongCount, setWrongCount] = useState(0)
  const [selected, setSelected] = useState(null)
  const [phase, setPhase] = useState('reading') // reading | answer | correct | wrong | wrong-ready

  useEffect(() => {
    if (phase === 'reading') {
      const t = setTimeout(() => setPhase('answer'), READ_DELAY_MS)
      return () => clearTimeout(t)
    }
    if (phase === 'wrong') {
      const t = setTimeout(() => setPhase('wrong-ready'), WRONG_DELAY_MS)
      return () => clearTimeout(t)
    }
    return undefined
  }, [phase])

  const answer = useCallback(
    (i) => {
      if (phase !== 'answer' || !question) return
      setSelected(i)
      if (i === question.answerIndex) {
        setPhase('correct')
      } else {
        setWrongCount((n) => n + 1)
        setPhase('wrong')
      }
    },
    [phase, question],
  )

  const outOfAttempts = wrongCount >= QUESTION_ATTEMPTS

  const proceed = useCallback(() => {
    if (phase === 'correct') {
      onDone({ correct: true, wrongCount })
    } else if (phase === 'wrong-ready') {
      if (outOfAttempts) {
        onDone({ correct: false, wrongCount })
      } else {
        setQuestion(deck.next())
        setSelected(null)
        setPhase('reading')
      }
    }
  }, [phase, outOfAttempts, onDone, wrongCount, deck])

  useEffect(() => {
    function onKey(e) {
      const n = Number(e.key)
      if (n >= 1 && n <= (question?.choices.length ?? 0)) answer(n - 1)
      else if (e.key === 'Enter' || e.key === ' ') proceed()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answer, proceed, question])

  if (!question) return null
  const isOx = question.choices.length === 2 && question.choices[0].text === 'O'
  const answered = phase !== 'reading' && phase !== 'answer'

  return (
    <div className="game-modal question-panel" role="dialog" aria-label="지식의 시련">
      <p className="game-modal-kicker">지식의 시련 · {title}</p>
      <p className="game-pause-note">전투가 멈춰 있어요. 천천히 읽어도 괜찮아요.</p>
      <h2 className="question-prompt">{question.prompt}</h2>
      <p className="question-hint" aria-live="polite">
        {phase === 'reading' ? '문제를 읽어 주세요. 잠시 후 고를 수 있어요.' : !answered ? '답을 골라 주세요.' : ''}
      </p>
      <div className={`answer-grid ${isOx ? 'ox' : ''}`}>
        {question.choices.map((choice, i) => {
          let cls = 'answer-option'
          if (answered && i === question.answerIndex) cls += ' is-correct'
          else if (answered && i === selected) cls += ' is-wrong'
          return (
            <button
              key={`${question.id}-${i}`}
              type="button"
              className={cls}
              disabled={phase !== 'answer'}
              onClick={() => answer(i)}
            >
              {!isOx && <span className="answer-num">{i + 1}</span>}
              {choice.imageUrl && <img src={choice.imageUrl} alt="" className="answer-image" />}
              <span className="answer-text">{choice.text}</span>
            </button>
          )
        })}
      </div>
      {phase === 'correct' && (
        <div className="question-result good" role="status">
          <p>정답! 지식의 빛이 깨어났어요.</p>
          <button type="button" className="game-primary" onClick={proceed} autoFocus>
            힘 선택하기
          </button>
        </div>
      )}
      {(phase === 'wrong' || phase === 'wrong-ready') && (
        <div className="question-result bad" role="status">
          <p>
            아쉬워요! 정답은{' '}
            <b>
              {isOx ? '' : `${CIRCLED[question.answerIndex] ?? question.answerIndex + 1} `}
              {question.choices[question.answerIndex].text}
            </b>
            {ieyo(question.choices[question.answerIndex].text)}.
          </p>
          {!outOfAttempts && (
            <p className="question-sub">
              다음 문제를 맞히면 힘을 얻을 수 있어요. (남은 기회 {QUESTION_ATTEMPTS - wrongCount}번)
            </p>
          )}
          <button type="button" className="game-primary" disabled={phase === 'wrong'} onClick={proceed}>
            {phase === 'wrong' ? '정답을 확인해 주세요…' : outOfAttempts ? '전투로 돌아가기' : '다음 문제'}
          </button>
        </div>
      )}
    </div>
  )
}
