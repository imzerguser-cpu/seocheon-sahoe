import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchAllQuestions } from '../lib/quizzesRepo.js'
import { selectVisibleQuestionsForScope } from '../lib/quizVisibility.js'
import { normalizeChoice } from '../lib/quizChoices.js'
import QuizPlaceholder from '../components/QuizPlaceholder.jsx'

const VALID_SCOPES = ['lesson', 'topic', 'unit']

function QuizQuestion({ question }) {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [selectedOx, setSelectedOx] = useState(null)
  const [shortAnswer, setShortAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  function handleSubmit() {
    let correct = false
    if (question.type === 'multiple-choice') {
      correct = selectedIndex === question.answerIndex
    } else if (question.type === 'ox') {
      correct = selectedOx === question.answer
    } else {
      correct = shortAnswer.trim() === question.answer.trim()
    }
    setIsCorrect(correct)
    setSubmitted(true)
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
                disabled={submitted}
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
            disabled={submitted}
            onClick={() => setSelectedOx('O')}
          >
            O
          </button>
          <button
            type="button"
            aria-pressed={selectedOx === 'X'}
            disabled={submitted}
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
            disabled={submitted}
            onChange={(e) => setShortAnswer(e.target.value)}
          />
        </>
      )}

      {!submitted && (
        <button type="button" onClick={handleSubmit}>
          제출
        </button>
      )}
      {submitted && (
        <p role="status">{isCorrect ? '정답이에요! 🎉' : '아쉬워요, 다시 도전해 보세요.'}</p>
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

  useEffect(() => {
    if (!isValidScope) {
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(false)
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
            <QuizQuestion key={question.id} question={question} />
          ))}
        </ol>
      )}
    </main>
  )
}
