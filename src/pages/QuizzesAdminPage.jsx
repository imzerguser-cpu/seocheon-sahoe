import { useState, useEffect } from 'react'
import { getPublishers, getUnits, getTopics, getLessons } from '../lib/dataLoader.js'
import {
  fetchQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../lib/quizzesRepo.js'

const SCOPE_LABELS = { lesson: '차시', topic: '학습주제', unit: '대단원' }

function refIdFor(scope, { unitId, topicId, lessonId }) {
  if (scope === 'unit') return unitId
  if (scope === 'topic') return topicId
  return lessonId
}

function QuestionForm({ initial, onSave, onCancel }) {
  const [type, setType] = useState(initial?.type ?? 'multiple-choice')
  const [question, setQuestion] = useState(initial?.question ?? '')
  const [choices, setChoices] = useState(initial?.choices ?? [])
  const [choiceInput, setChoiceInput] = useState('')
  const [answerIndex, setAnswerIndex] = useState(initial?.answerIndex ?? 0)
  const [answer, setAnswer] = useState(initial?.answer ?? '')

  function addChoice() {
    if (!choiceInput) return
    setChoices((c) => [...c, choiceInput])
    setChoiceInput('')
  }

  function removeChoice(index) {
    setChoices((c) => c.filter((_, i) => i !== index))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (type === 'multiple-choice') {
      onSave({ type, question, choices, answerIndex })
    } else if (type === 'ox') {
      onSave({ type, question, answer })
    } else {
      onSave({ type, question, answer })
    }
  }

  return (
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
              <li key={`${choice}-${i}`}>
                <label htmlFor={`answer-${i}`}>정답: {choice}</label>
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
          <button type="button" onClick={addChoice}>
            보기 추가
          </button>
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

      <button type="submit">저장</button>
      <button type="button" onClick={onCancel}>
        취소
      </button>
    </form>
  )
}

export default function QuizzesAdminPage() {
  const [scope, setScope] = useState('lesson')
  const publishers = getPublishers()
  const [publisherId, setPublisherId] = useState(publishers[0]?.id ?? '')
  const units = getUnits(publisherId)
  const [unitId, setUnitId] = useState(units[0]?.id ?? '')
  const topics = getTopics(publisherId, unitId)
  const [topicId, setTopicId] = useState(topics[0]?.id ?? '')
  const lessons = getLessons(publisherId, unitId, topicId)
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? '')

  const [questions, setQuestions] = useState([])
  const [mode, setMode] = useState('list')

  const refId = refIdFor(scope, { unitId, topicId, lessonId })

  function reload() {
    if (!refId) {
      setQuestions([])
      return
    }
    fetchQuestions(scope, refId).then(setQuestions)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, refId])

  async function handleSave(data) {
    if (mode === 'create') {
      await createQuestion({ scope, refId, ...data })
    } else if (mode && mode.edit) {
      await updateQuestion(mode.edit, { scope, refId, ...data })
    }
    setMode('list')
    reload()
  }

  async function handleDelete(questionId) {
    await deleteQuestion(questionId)
    reload()
  }

  if (mode === 'create') {
    return <QuestionForm onSave={handleSave} onCancel={() => setMode('list')} />
  }
  if (mode && mode.edit) {
    const editing = questions.find((q) => q.id === mode.edit)
    return <QuestionForm initial={editing} onSave={handleSave} onCancel={() => setMode('list')} />
  }

  return (
    <main className="quizzes-admin-page">
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
          setPublisherId(e.target.value)
          setUnitId('')
          setTopicId('')
          setLessonId('')
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
          setUnitId(e.target.value)
          setTopicId('')
          setLessonId('')
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
          setTopicId(e.target.value)
          setLessonId('')
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

      <button type="button" onClick={() => setMode('create')}>
        새 문제 추가
      </button>

      <ul className="questions-list">
        {questions.map((q) => (
          <li key={q.id}>
            <span>{q.question}</span>
            <button type="button" onClick={() => setMode({ edit: q.id })}>
              수정
            </button>
            <button type="button" onClick={() => handleDelete(q.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
