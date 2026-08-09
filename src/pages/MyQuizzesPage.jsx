import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { fetchAllQuestions, updateQuestion, deleteQuestion } from '../lib/quizzesRepo.js'
import { QuestionForm } from './QuizzesAdminPage.jsx'

const TYPE_LABELS = { 'multiple-choice': '객관식', ox: 'OX', 'short-answer': '단답식' }

export default function MyQuizzesPage() {
  const { session } = useAuth()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [editingId, setEditingId] = useState(null)
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

  const myQuestions = questions.filter(
    (q) =>
      q.submittedBy?.schoolId === session?.schoolId &&
      q.submittedBy?.studentName === session?.studentName,
  )
  const editing = myQuestions.find((q) => q.id === editingId)

  async function handleSave(data) {
    setSaveError('')
    try {
      await updateQuestion(editingId, {
        scope: editing.scope,
        refId: editing.refId,
        status: editing.status ?? 'published',
        visible: editing.visible !== false,
        submittedBy: editing.submittedBy,
        ...data,
      })
      setEditingId(null)
      reload()
    } catch {
      setSaveError('저장에 실패했어요. 다시 시도해 주세요.')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('이 퀴즈를 삭제할까요? 되돌릴 수 없어요.')) return
    await deleteQuestion(id)
    reload()
  }

  if (editing) {
    return (
      <QuestionForm
        initial={editing}
        onSave={handleSave}
        onCancel={() => {
          setSaveError('')
          setEditingId(null)
        }}
        error={saveError}
        backTo="/my-quizzes"
        backLabel="← 내가 만든 퀴즈로"
      />
    )
  }

  return (
    <main className="quizzes-admin-page">
      <Link to={`/p/${session?.publisherId}`} className="back-link">
        ← 대단원 목록으로
      </Link>
      <h1>내가 만든 퀴즈</h1>
      {loading && <p className="empty-state">불러오는 중...</p>}
      {!loading && loadError && <p className="empty-state">목록을 불러오지 못했어요.</p>}
      {!loading && !loadError && myQuestions.length === 0 && (
        <p className="empty-state">아직 만든 퀴즈가 없어요.</p>
      )}
      {!loading && !loadError && myQuestions.length > 0 && (
        <ul className="questions-list">
          {myQuestions.map((q) => (
            <li key={q.id}>
              {q.status === 'pending' && <span className="status-badge">검토 대기</span>}
              <span>[{TYPE_LABELS[q.type] ?? q.type}] {q.question}</span>
              <button
                type="button"
                onClick={() => {
                  setSaveError('')
                  setEditingId(q.id)
                }}
              >
                수정
              </button>
              <button type="button" onClick={() => handleDelete(q.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
