import { useParams } from 'react-router-dom'
import { getQuizQuestions } from '../lib/dataLoader.js'
import QuizPlaceholder from '../components/QuizPlaceholder.jsx'

const VALID_SCOPES = ['lesson', 'topic', 'unit']

export default function QuizPage() {
  const { scope, refId } = useParams()
  const isValidScope = VALID_SCOPES.includes(scope)
  const questions = isValidScope ? getQuizQuestions(scope, refId) : []

  return (
    <main>
      <h1>퀴즈</h1>
      {!isValidScope && <p className="empty-state">알 수 없는 퀴즈 범위예요.</p>}
      {isValidScope && questions.length === 0 && (
        <QuizPlaceholder scope={scope} questionCount={questions.length} />
      )}
      {isValidScope && questions.length > 0 && (
        <ol>
          {questions.map((question) => (
            <li key={question.id}>{question.question}</li>
          ))}
        </ol>
      )}
    </main>
  )
}
