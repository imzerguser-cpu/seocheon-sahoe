import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { createQuestion } from '../lib/quizzesRepo.js'
import { findMatchingRefsAcrossPublishers } from '../lib/dataLoader.js'
import { QuestionForm } from './QuizzesAdminPage.jsx'

export default function StudentQuizSubmitPage() {
  const { publisherId, unitId, topicId, lessonId } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const lessonPath = `/p/${publisherId}/${unitId}/${topicId}/${lessonId}`

  async function handleSave(data) {
    setError('')
    try {
      const refs = findMatchingRefsAcrossPublishers(publisherId, 'lesson', {
        unitId,
        topicId,
        lessonId,
      })
      await createQuestion(
        { scope: 'lesson', refId: lessonId, refs, ...data },
        {
          status: 'pending',
          submittedBy: {
            schoolId: session?.schoolId ?? '',
            schoolName: session?.schoolName ?? '',
            studentName: session?.studentName ?? '',
            role: session?.role ?? 'student',
          },
        },
      )
      setSubmitted(true)
    } catch {
      setError('퀴즈 제출에 실패했어요. 다시 시도해 주세요.')
    }
  }

  if (submitted) {
    return (
      <main className="quizzes-admin-page">
        <p className="save-notice">
          검토 요청을 보냈어요. 선생님이나 관리자가 확인한 뒤 다른 학생들에게도 보여요.
        </p>
        <Link to={lessonPath} className="back-link">
          ← 차시로 돌아가기
        </Link>
      </main>
    )
  }

  return (
    <QuestionForm
      onSave={handleSave}
      onCancel={() => navigate(lessonPath)}
      error={error}
      backTo={lessonPath}
      backLabel="← 차시로 돌아가기"
      notice="만든 퀴즈는 선생님이나 관리자가 확인한 뒤에 다른 학생들에게 보여요. 학교 이름과 이름도 함께 표시돼요."
    />
  )
}
