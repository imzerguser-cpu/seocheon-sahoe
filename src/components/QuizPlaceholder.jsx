const SCOPE_LABELS = {
  lesson: '차시',
  topic: '학습주제',
  unit: '대단원',
}

export default function QuizPlaceholder({ scope, questionCount }) {
  return (
    <div className="quiz-placeholder">
      <p>이 {SCOPE_LABELS[scope] ?? scope} 퀴즈는 준비 중이에요.</p>
      <p>현재 등록된 문항 수: {questionCount}개</p>
    </div>
  )
}
