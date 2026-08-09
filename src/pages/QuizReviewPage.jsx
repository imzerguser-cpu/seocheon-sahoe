import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchAllQuestions,
  publishQuestion,
  deleteQuestion,
} from '../lib/quizzesRepo.js'
import { getAdminSession } from '../lib/auth.js'
import { QuestionForm } from './QuizzesAdminPage.jsx'

function submittedByLabel(question) {
  const by = question.submittedBy
  if (!by) return '제출자 정보 없음'
  return `${by.schoolName || by.schoolId} · ${by.studentName}`
}

export default function QuizReviewPage() {
  const adminSession = getAdminSession()
  const isSuperAdmin = adminSession?.role === 'super-admin'

  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reviewingId, setReviewingId] = useState(null)
  const [saveError, setSaveError] = useState('')

  function reload() {
    setLoading(true)
    setLoadError(false)
    fetchAllQuestions()
      .then((list) => {
        setQuestions(list)
        setLoading(false)
      })
      .catch(() => {
        setLoadError(true)
        setLoading(false)
      })
  }

  useEffect(() => {
    reload()
  }, [])

  const pendingQuestions = questions.filter(
    (q) =>
      q.status === 'pending' &&
      (isSuperAdmin || q.submittedBy?.schoolId === adminSession?.schoolId),
  )

  async function handlePublish(form) {
    setSaveError('')
    try {
      const reviewing = questions.find((q) => q.id === reviewingId)
      await publishQuestion(reviewingId, {
        scope: reviewing.scope,
        refId: reviewing.refId,
        refs: reviewing.refs ?? [],
        submittedBy: reviewing.submittedBy,
        ...form,
      })
      setReviewingId(null)
      reload()
    } catch {
      setSaveError('반영에 실패했어요. 다시 시도해 주세요.')
    }
  }

  async function handleReject(questionId) {
    if (!window.confirm('이 요청을 반려할까요? 되돌릴 수 없어요.')) return
    await deleteQuestion(questionId)
    reload()
  }

  if (reviewingId) {
    const reviewing = questions.find((q) => q.id === reviewingId)
    return (
      <QuestionForm
        initial={reviewing}
        onSave={handlePublish}
        onCancel={() => {
          setSaveError('')
          setReviewingId(null)
        }}
        error={saveError}
      />
    )
  }

  return (
    <main className="quizzes-admin-page">
      <Link to="/admin" className="back-link">
        ← 관리자 대시보드로
      </Link>
      <h1>검토 대기 퀴즈</h1>
      {loading && <p className="empty-state">불러오는 중...</p>}
      {!loading && loadError && <p className="empty-state">목록을 불러오지 못했어요.</p>}
      {!loading && !loadError && pendingQuestions.length === 0 && (
        <p className="empty-state">검토할 요청이 없어요.</p>
      )}
      <ul className="questions-list">
        {pendingQuestions.map((question) => (
          <li key={question.id}>
            <span className="status-badge">검토 대기</span>
            <span>{question.question}</span>
            <span>{submittedByLabel(question)}</span>
            <button
              type="button"
              onClick={() => {
                setSaveError('')
                setReviewingId(question.id)
              }}
            >
              검토하기
            </button>
            <button type="button" onClick={() => handleReject(question.id)}>
              반려
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
