import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPublishers, getUnits, getTopics, getLessons } from '../lib/dataLoader.js'
import { defaultPublisherId } from '../lib/adminPublisher.js'
import {
  fetchAllQuestions,
  createQuestion,
  updateQuestion,
  setQuestionVisibility,
  deleteQuestion,
} from '../lib/quizzesRepo.js'
import { normalizeChoice } from '../lib/quizChoices.js'
import { isSafeUrl } from '../components/ResourceCard.jsx'
import { refIdForPublisher } from '../lib/quizVisibility.js'

const SCOPE_LABELS = { lesson: '차시', topic: '학습주제', unit: '대단원' }
const TYPE_LABELS = { 'multiple-choice': '객관식', ox: 'OX', 'short-answer': '단답식' }

function refIdFor(scope, { unitId, topicId, lessonId }) {
  if (scope === 'unit') return unitId
  if (scope === 'topic') return topicId
  return lessonId
}

function sameGroup(a, b) {
  if (!a || !b) return false
  if (a.type !== b.type) return false
  return a.type === 'unit' ? true : a.topicId === b.topicId
}

function QuestionDetail({ question }) {
  if (question.type === 'multiple-choice') {
    return (
      <ul className="question-detail-choices">
        {(question.choices ?? []).map(normalizeChoice).map((choice, i) => (
          <li key={`${choice.text}-${i}`}>
            {i === question.answerIndex ? '✅' : '⬜'} {choice.text}
            {choice.imageUrl && (
              <img src={choice.imageUrl} alt={choice.text} className="choice-thumb" />
            )}
          </li>
        ))}
      </ul>
    )
  }
  return <p className="question-detail-answer">정답: {question.answer}</p>
}

export function QuestionForm({
  initial,
  onSave,
  onCancel,
  error,
  backTo = '/admin',
  backLabel = '← 관리자 대시보드로',
  notice,
}) {
  const [type, setType] = useState(initial?.type ?? 'multiple-choice')
  const [question, setQuestion] = useState(initial?.question ?? '')
  const [choices, setChoices] = useState((initial?.choices ?? []).map(normalizeChoice))
  const [choiceInput, setChoiceInput] = useState('')
  const [choiceImageInput, setChoiceImageInput] = useState('')
  const [choiceImageError, setChoiceImageError] = useState('')
  const [answerIndex, setAnswerIndex] = useState(initial?.answerIndex ?? 0)
  const [answer, setAnswer] = useState(initial?.answer ?? '')

  function addChoice() {
    if (!choiceInput) return
    if (choiceImageInput && !isSafeUrl(choiceImageInput)) {
      setChoiceImageError('http:// 또는 https://로 시작하는 링크만 추가할 수 있어요.')
      return
    }
    setChoiceImageError('')
    setChoices((c) => [...c, { text: choiceInput, imageUrl: choiceImageInput }])
    setChoiceInput('')
    setChoiceImageInput('')
  }

  function removeChoice(index) {
    setChoices((c) => c.filter((_, i) => i !== index))
  }

  const hasQuestionText = question.trim().length > 0
  const canSave = hasQuestionText && (
    type === 'multiple-choice'
      ? choices.length >= 2 && answerIndex >= 0 && answerIndex < choices.length
      : type === 'ox'
        ? answer === 'O' || answer === 'X'
        : answer.trim().length > 0
  )

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSave) return
    if (type === 'multiple-choice') {
      onSave({ type, question, choices, answerIndex })
    } else if (type === 'ox') {
      onSave({ type, question, answer })
    } else {
      onSave({ type, question, answer })
    }
  }

  return (
    <main className="quizzes-admin-page">
      <Link to={backTo} className="back-link">
        {backLabel}
      </Link>
      {notice && <p className="approval-notice">{notice}</p>}
      <form onSubmit={handleSubmit} className="question-form">
      <label htmlFor="question-type">문제 유형</label>
      <select id="question-type" value={type} onChange={(e) => setType(e.target.value)}>
        <option value="multiple-choice">객관식</option>
        <option value="ox">OX</option>
        <option value="short-answer">단답식</option>
      </select>

      <label htmlFor="question-text">문제</label>
      <input
        id="question-text"
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      {type === 'multiple-choice' && (
        <fieldset>
          <legend>보기</legend>
          <ul>
            {choices.map((choice, i) => (
              <li key={`${choice.text}-${i}`}>
                {choice.imageUrl && (
                  <img src={choice.imageUrl} alt={choice.text} className="choice-thumb" />
                )}
                <label htmlFor={`answer-${i}`}>정답: {choice.text}</label>
                <input
                  id={`answer-${i}`}
                  type="radio"
                  name="answerIndex"
                  checked={answerIndex === i}
                  onChange={() => setAnswerIndex(i)}
                />
                <button type="button" onClick={() => removeChoice(i)}>
                  삭제
                </button>
              </li>
            ))}
          </ul>
          <label htmlFor="choice-input">보기 텍스트</label>
          <input
            id="choice-input"
            type="text"
            value={choiceInput}
            onChange={(e) => setChoiceInput(e.target.value)}
          />
          <label htmlFor="choice-image-input">보기 이미지 링크 (선택)</label>
          <input
            id="choice-image-input"
            type="text"
            value={choiceImageInput}
            onChange={(e) => setChoiceImageInput(e.target.value)}
            placeholder="사진/유적 등을 보고 고르는 문제라면 링크를 붙여넣으세요"
          />
          <button type="button" onClick={addChoice}>
            보기 추가
          </button>
          {choiceImageError && <p role="alert">{choiceImageError}</p>}
        </fieldset>
      )}

      {type === 'ox' && (
        <fieldset>
          <legend>정답</legend>
          <label htmlFor="answer-o">정답: O</label>
          <input
            id="answer-o"
            type="radio"
            name="ox-answer"
            checked={answer === 'O'}
            onChange={() => setAnswer('O')}
          />
          <label htmlFor="answer-x">정답: X</label>
          <input
            id="answer-x"
            type="radio"
            name="ox-answer"
            checked={answer === 'X'}
            onChange={() => setAnswer('X')}
          />
        </fieldset>
      )}

      {type === 'short-answer' && (
        <>
          <label htmlFor="short-answer">정답</label>
          <input
            id="short-answer"
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </>
      )}

      <button type="submit" disabled={!canSave}>
        저장
      </button>
      <button type="button" onClick={onCancel}>
        취소
      </button>
      {error && <p role="alert">{error}</p>}
      </form>
    </main>
  )
}

export default function QuizzesAdminPage() {
  const [scope, setScope] = useState('lesson')
  const publishers = getPublishers()
  const [publisherId, setPublisherId] = useState(() =>
    defaultPublisherId(publishers, 'chunjae-park'),
  )
  const units = getUnits(publisherId)
  const [unitId, setUnitId] = useState(units[0]?.id ?? '')
  const topics = getTopics(publisherId, unitId)
  const [topicId, setTopicId] = useState(topics[0]?.id ?? '')
  const lessons = getLessons(publisherId, unitId, topicId)
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? '')

  const [mode, setMode] = useState('list')
  const [saveError, setSaveError] = useState('')
  const [editingQuestion, setEditingQuestion] = useState(null)

  const [expandedGroup, setExpandedGroup] = useState(null)
  const [expandedQuestionId, setExpandedQuestionId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const refId = refIdFor(scope, { unitId, topicId, lessonId })

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

  function questionsForTopic(targetUnitId, topicId) {
    const topicLessons = getLessons(publisherId, targetUnitId, topicId)
    const lessonIds = new Set(topicLessons.map((l) => l.id))
    const lessonOrderById = new Map(topicLessons.map((l) => [l.id, l.차시순서]))
    return questions
      .filter((q) => {
        const matchedRefId = refIdForPublisher(q, publisherId)
        return (
          (q.scope === 'topic' && matchedRefId === topicId) ||
          (q.scope === 'lesson' && lessonIds.has(matchedRefId))
        )
      })
      .map((q) => {
        const matchedRefId = refIdForPublisher(q, publisherId)
        return {
          ...q,
          groupLabel: q.scope === 'topic' ? '학습주제 전체' : `${lessonOrderById.get(matchedRefId)}차시`,
        }
      })
  }

  // 학습주제(및 그 차시)에서 만든 퀴즈는 자동으로 대단원 전체 퀴즈에도 속한다.
  function questionsForUnit(targetUnitId) {
    const unitQuestions = questions
      .filter((q) => q.scope === 'unit' && refIdForPublisher(q, publisherId) === targetUnitId)
      .map((q) => ({ ...q, groupLabel: '대단원 전체' }))
    const rolledUp = getTopics(publisherId, targetUnitId).flatMap((topic) =>
      questionsForTopic(targetUnitId, topic.id).map((q) => ({
        ...q,
        groupLabel: `${topic.title} · ${q.groupLabel}`,
      })),
    )
    return [...unitQuestions, ...rolledUp]
  }

  function questionsForGroup(group) {
    if (!group) return []
    return group.type === 'unit' ? questionsForUnit(unitId) : questionsForTopic(unitId, group.topicId)
  }

  function toggleGroup(group) {
    if (sameGroup(expandedGroup, group)) {
      setExpandedGroup(null)
      setExpandedQuestionId(null)
      return
    }
    setExpandedGroup(group)
    setExpandedQuestionId(null)
  }

  async function handleSave(data) {
    setSaveError('')
    try {
      if (mode === 'create') {
        await createQuestion({ scope, refId, ...data })
      } else if (mode && mode.edit) {
        await updateQuestion(mode.edit, {
          scope: editingQuestion.scope,
          refId: editingQuestion.refId,
          visible: editingQuestion.visible !== false,
          status: editingQuestion.status ?? 'published',
          submittedBy: editingQuestion.submittedBy ?? null,
          ...data,
        })
      }
      setMode('list')
      reload()
    } catch {
      setSaveError('문제 저장에 실패했어요. 다시 시도해 주세요.')
    }
  }

  async function handleDelete(questionId) {
    if (!window.confirm('이 문제를 삭제할까요? 되돌릴 수 없어요.')) return
    await deleteQuestion(questionId)
    reload()
  }

  async function handleToggleVisible(question) {
    const isCurrentlyVisible = question.visible !== false
    await setQuestionVisibility(question.id, !isCurrentlyVisible)
    reload()
  }

  if (mode === 'create') {
    return (
      <QuestionForm
        onSave={handleSave}
        onCancel={() => {
          setSaveError('')
          setMode('list')
        }}
        error={saveError}
      />
    )
  }
  if (mode && mode.edit) {
    return (
      <QuestionForm
        initial={editingQuestion}
        onSave={handleSave}
        onCancel={() => {
          setSaveError('')
          setMode('list')
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
      <h1>퀴즈 관리</h1>
      <label htmlFor="scope-select">범위</label>
      <select id="scope-select" value={scope} onChange={(e) => setScope(e.target.value)}>
        {Object.entries(SCOPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <label htmlFor="publisher-select">출판사</label>
      <select
        id="publisher-select"
        value={publisherId}
        onChange={(e) => {
          const newPublisherId = e.target.value
          setPublisherId(newPublisherId)
          const newUnits = getUnits(newPublisherId)
          const newUnitId = newUnits[0]?.id ?? ''
          setUnitId(newUnitId)
          const newTopics = getTopics(newPublisherId, newUnitId)
          const newTopicId = newTopics[0]?.id ?? ''
          setTopicId(newTopicId)
          setLessonId(getLessons(newPublisherId, newUnitId, newTopicId)[0]?.id ?? '')
          setExpandedGroup(null)
          setExpandedQuestionId(null)
        }}
      >
        {publishers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <label htmlFor="unit-select">대단원</label>
      <select
        id="unit-select"
        value={unitId}
        onChange={(e) => {
          const newUnitId = e.target.value
          setUnitId(newUnitId)
          const newTopics = getTopics(publisherId, newUnitId)
          const newTopicId = newTopics[0]?.id ?? ''
          setTopicId(newTopicId)
          setLessonId(getLessons(publisherId, newUnitId, newTopicId)[0]?.id ?? '')
          setExpandedGroup(null)
          setExpandedQuestionId(null)
        }}
      >
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.title}
          </option>
        ))}
      </select>
      <label htmlFor="topic-select">학습주제</label>
      <select
        id="topic-select"
        value={topicId}
        onChange={(e) => {
          const newTopicId = e.target.value
          setTopicId(newTopicId)
          setLessonId(getLessons(publisherId, unitId, newTopicId)[0]?.id ?? '')
        }}
      >
        {topics.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>
      <label htmlFor="lesson-select">차시</label>
      <select id="lesson-select" value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
        {lessons.map((l) => (
          <option key={l.id} value={l.id}>
            {l.차시순서} / {l.전체차시}차시
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => {
          setSaveError('')
          setMode('create')
        }}
      >
        새 문제 추가
      </button>
      <p className="field-hint">
        위에서 고른 범위·대상에 새 문제가 등록돼요. 아래 목록에서는 대단원의 학습주제를
        눌러 이미 등록된 문제를 아코디언으로 볼 수 있어요.
      </p>

      {loading && <p className="empty-state">불러오는 중...</p>}
      {!loading && loadError && (
        <p className="empty-state">문제 목록을 불러오지 못했어요.</p>
      )}

      {!loading && !loadError && (
        <ul className="topic-accordion-list">
          <li className="topic-accordion-item">
            <button
              type="button"
              className="topic-accordion-header"
              aria-expanded={expandedGroup?.type === 'unit'}
              onClick={() => toggleGroup({ type: 'unit' })}
            >
              이 대단원 전체 퀴즈 ({questionsForUnit(unitId).length})
            </button>
            {expandedGroup?.type === 'unit' && (
              <QuestionGroup
                questions={questionsForGroup(expandedGroup)}
                expandedQuestionId={expandedQuestionId}
                onToggleQuestion={setExpandedQuestionId}
                onEdit={(q) => {
                  setSaveError('')
                  setEditingQuestion(q)
                  setMode({ edit: q.id })
                }}
                onDelete={handleDelete}
                onToggleVisible={handleToggleVisible}
              />
            )}
          </li>
          {topics.map((topic) => (
            <li key={topic.id} className="topic-accordion-item">
              <button
                type="button"
                className="topic-accordion-header"
                aria-expanded={sameGroup(expandedGroup, { type: 'topic', topicId: topic.id })}
                onClick={() => toggleGroup({ type: 'topic', topicId: topic.id })}
              >
                {topic.title} ({questionsForTopic(unitId, topic.id).length})
              </button>
              {sameGroup(expandedGroup, { type: 'topic', topicId: topic.id }) && (
                <QuestionGroup
                  questions={questionsForGroup(expandedGroup)}
                  expandedQuestionId={expandedQuestionId}
                  onToggleQuestion={setExpandedQuestionId}
                  onEdit={(q) => {
                    setSaveError('')
                    setEditingQuestion(q)
                    setMode({ edit: q.id })
                  }}
                  onDelete={handleDelete}
                  onToggleVisible={handleToggleVisible}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function QuestionGroup({
  questions,
  expandedQuestionId,
  onToggleQuestion,
  onEdit,
  onDelete,
  onToggleVisible,
}) {
  if (questions.length === 0) {
    return <p className="empty-state">이 범위에는 아직 등록된 문제가 없어요.</p>
  }
  return (
    <ul className="questions-list">
      {questions.map((q) => {
        const isOpen = expandedQuestionId === q.id
        const isVisible = q.visible !== false
        const isPending = q.status === 'pending'
        return (
          <li key={q.id}>
            {isPending && <span className="status-badge">검토 대기</span>}
            <button
              type="button"
              className="question-summary"
              aria-expanded={isOpen}
              onClick={() => onToggleQuestion(isOpen ? null : q.id)}
            >
              [{q.groupLabel} · {TYPE_LABELS[q.type] ?? q.type}] {q.question}
            </button>
            {q.submittedBy && (
              <span className="quiz-submitted-by">
                제출: {q.submittedBy.schoolName || q.submittedBy.schoolId} ·{' '}
                {q.submittedBy.studentName}
              </span>
            )}
            {isOpen && <QuestionDetail question={q} />}
            <label className="quiz-visibility-toggle">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => onToggleVisible(q)}
              />
              학생에게 보이기
            </label>
            <button type="button" onClick={() => onEdit(q)}>
              수정
            </button>
            <button type="button" onClick={() => onDelete(q.id)}>
              삭제
            </button>
          </li>
        )
      })}
    </ul>
  )
}
