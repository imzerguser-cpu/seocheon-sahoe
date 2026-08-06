import { useParams } from 'react-router-dom'
import { getQuizQuestions } from '../lib/dataLoader.js'
import QuizPlaceholder from '../components/QuizPlaceholder.jsx'

export default function QuizPage() {
  const { scope, refId } = useParams()
  const questions = getQuizQuestions(scope, refId)

  return (
    <main>
      <h1>퀴즈</h1>
      {questions.length === 0 ? (
        <QuizPlaceholder scope={scope} questionCount={0} />
      ) : (
        <ol>
          {questions.map((question) => (
            <li key={question.id}>{question.question}</li>
          ))}
        </ol>
      )}
    </main>
  )
}
