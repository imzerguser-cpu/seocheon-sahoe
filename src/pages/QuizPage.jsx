import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchAllQuestions } from '../lib/quizzesRepo.js'
import { selectVisibleQuestionsForScope } from '../lib/quizVisibility.js'
import { normalizeChoice } from '../lib/quizChoices.js'
import QuizPlaceholder from '../components/QuizPlaceholder.jsx'

const VALID_SCOPES = ['lesson', 'topic', 'unit']

function correctAnswerLabel(question) {
  if (question.type === 'multiple-choice') {
    return normalizeChoice(question.choices[question.answerIndex]).text
  }
  return question.answer
}

// 한 번 틀려도 한 번 더 도전할 수 있게, 두 번째 시도까지 틀려야 최종 오답으로
// 확정하고 정답을 알려준다. 정답을 맞히거나 두 번째 시도까지 끝나면(=최종
// 결과가 정해지면) onFinal로 부모에게 알려 대단원 퀴즈 결과 집계에 반영한다.
function QuizQuestion({ question, onFinal }) {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [selectedOx, setSelectedOx] = useState(null)
  const [shortAnswer, setShortAnswer] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [result, setResult] = useState(null) // null | 'correct' | 'incorrect' | 'final-incorrect'
  const isFinal = result === 'correct' || result === 'final-incorrect'

  function handleSubmit() {
    let correct = false
    if (question.type === 'multiple-choice') {
      correct = selectedIndex === question.answerIndex
    } else if (question.type === 'ox') {
      correct = selectedOx === question.answer
    } else {
      correct = shortAnswer.trim() === question.answer.trim()
    }
    const nextAttempts = attempts + 1
    setAttempts(nextAttempts)
    if (correct) {
      setResult('correct')
      onFinal(question.id, true)
    } else if (nextAttempts >= 2) {
      setResult('final-incorrect')
      onFinal(question.id, false)
    } else {
      setResult('incorrect')
    }
  }

  return (
    <li className="quiz-question">
      <p>{question.question}</p>
      {question.submittedBy && (
        <p className="quiz-submitted-by">
          만든이: {question.submittedBy.schoolName} · {question.submittedBy.studentName}
        </p>
      )}

      {question.type === 'multiple-choice' && (
        <ul>
          {question.choices.map(normalizeChoice).map((choice, i) => (
            <li key={`${choice.text}-${i}`}>
              <label htmlFor={`choice-${question.id}-${i}`}>
                {choice.imageUrl && (
                  <img src={choice.imageUrl} alt={choice.text} className="choice-image" />
                )}
                {choice.text}
              </label>
              <input
                id={`choice-${question.id}-${i}`}
                type="radio"
                name={`answer-${question.id}`}
                checked={selectedIndex === i}
                disabled={isFinal}
                onChange={() => setSelectedIndex(i)}
              />
            </li>
          ))}
        </ul>
      )}

      {question.type === 'ox' && (
        <div className="ox-buttons">
          <button
            type="button"
            aria-pressed={selectedOx === 'O'}
            disabled={isFinal}
            onClick={() => setSelectedOx('O')}
          >
            O
          </button>
          <button
            type="button"
            aria-pressed={selectedOx === 'X'}
            disabled={isFinal}
            onClick={() => setSelectedOx('X')}
          >
            X
          </button>
        </div>
      )}

      {question.type === 'short-answer' && (
        <>
          <label htmlFor={`short-answer-${question.id}`}>답 입력</label>
          <input
            id={`short-answer-${question.id}`}
            type="text"
            value={shortAnswer}
            disabled={isFinal}
            onChange={(e) => setShortAnswer(e.target.value)}
          />
        </>
      )}

      {!isFinal && (
        <button type="button" onClick={handleSubmit}>
          제출
        </button>
      )}
      {result === 'correct' && <p role="status">정답이에요! 🎉</p>}
      {result === 'incorrect' && <p role="status">아쉬워요, 다시 도전해 보세요.</p>}
      {result === 'final-incorrect' && (
        <p role="status">아쉬워요, 정답은 {correctAnswerLabel(question)}예요.</p>
      )}
    </li>
  )
}

export default function QuizPage() {
  const { publisherId, scope, refId } = useParams()
  const navigate = useNavigate()
  const isValidScope = VALID_SCOPES.includes(scope)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [results, setResults] = useState({})
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => {
    if (!isValidScope) {
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(false)
    setResults({})
    setShowSummary(false)
    fetchAllQuestions()
      .then((all) => {
        setQuestions(selectVisibleQuestionsForScope(all, { publisherId, scope, refId }))
        setLoading(false)
      })
      .catch(() => {
        setLoadError(true)
        setLoading(false)
      })
  }, [publisherId, scope, refId, isValidScope])

  function handleFinal(questionId, correct) {
    setResults((prev) => {
      const next = { ...prev, [questionId]: correct }
      if (Object.keys(next).length === questions.length) {
        setShowSummary(true)
      }
      return next
    })
  }

  const correctCount = Object.values(results).filter(Boolean).length

  return (
    <main>
      <button type="button" onClick={() => navigate(-1)}>
        뒤로 가기
      </button>
      <h1>퀴즈</h1>
      {!isValidScope && <p className="empty-state">알 수 없는 퀴즈 범위예요.</p>}
      {isValidScope && loading && <p className="empty-state">불러오는 중...</p>}
      {isValidScope && !loading && loadError && (
        <p className="empty-state">퀴즈를 불러오지 못했어요.</p>
      )}
      {isValidScope && !loading && !loadError && questions.length === 0 && (
        <QuizPlaceholder scope={scope} questionCount={0} />
      )}
      {isValidScope && !loading && !loadError && questions.length > 0 && (
        <ol className="quiz-question-list">
          {questions.map((question) => (
            <QuizQuestion key={question.id} question={question} onFinal={handleFinal} />
          ))}
        </ol>
      )}
      {showSummary && (
        <div className="quiz-summary-backdrop">
          <div className="quiz-summary-dialog" role="dialog" aria-label="퀴즈 결과">
            <p>
              {questions.length}문제 중 {correctCount}개 정답이에요!
            </p>
            <button type="button" onClick={() => setShowSummary(false)}>
              확인
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
