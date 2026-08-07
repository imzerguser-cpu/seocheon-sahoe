import { useState, useEffect } from 'react'
import { getPublishers, getUnits, getTopics, getLessons } from '../lib/dataLoader.js'
import {
  fetchAllMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from '../lib/materialsRepo.js'
import { isSafeUrl } from '../components/ResourceCard.jsx'

const RESOURCE_TYPE_LABELS = { photo: '사진', video: '영상', qr: 'QR' }
const emptyForm = { title: '', usageNote: '', resources: [], lessonRefs: [] }

function lessonRefLabel(ref) {
  const publisher = getPublishers().find((p) => p.id === ref.publisherId)
  const units = getUnits(ref.publisherId)
  for (const unit of units) {
    const topics = getTopics(ref.publisherId, unit.id)
    for (const topic of topics) {
      const lesson = getLessons(ref.publisherId, unit.id, topic.id).find(
        (l) => l.id === ref.lessonId,
      )
      if (lesson) {
        return `${publisher?.name ?? ref.publisherId} · ${unit.title} · ${topic.title} · ${lesson.차시순서} / ${lesson.전체차시}차시`
      }
    }
  }
  return ref.lessonId
}

function MaterialForm({ initial, onSave, onCancel, error }) {
  const { id: _id, lessonIds: _lessonIds, ...initialWithoutId } = initial ?? emptyForm
  const [form, setForm] = useState(initialWithoutId)
  const [resourceType, setResourceType] = useState('photo')
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
  const [resourceError, setResourceError] = useState('')

  const publishers = getPublishers()
  const [publisherId, setPublisherId] = useState(publishers[0]?.id ?? '')
  const units = getUnits(publisherId)
  const [unitId, setUnitId] = useState(units[0]?.id ?? '')
  const topics = getTopics(publisherId, unitId)
  const [topicId, setTopicId] = useState(topics[0]?.id ?? '')
  const lessons = getLessons(publisherId, unitId, topicId)
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? '')

  function addResource() {
    if (!resourceUrl) return
    if (!isSafeUrl(resourceUrl)) {
      setResourceError('http:// 또는 https://로 시작하는 링크만 추가할 수 있어요.')
      return
    }
    setResourceError('')
    setForm((f) => ({
      ...f,
      resources: [...f.resources, { type: resourceType, title: resourceTitle, url: resourceUrl }],
    }))
    setResourceTitle('')
    setResourceUrl('')
  }

  function removeResource(index) {
    setForm((f) => ({ ...f, resources: f.resources.filter((_, i) => i !== index) }))
  }

  function addLessonRef() {
    if (!lessonId) return
    if (form.lessonRefs.some((r) => r.lessonId === lessonId)) return
    setForm((f) => ({ ...f, lessonRefs: [...f.lessonRefs, { publisherId, lessonId }] }))
  }

  function removeLessonRef(index) {
    setForm((f) => ({ ...f, lessonRefs: f.lessonRefs.filter((_, i) => i !== index) }))
  }

  const canSave = form.title.trim().length > 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSave) return
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="material-form">
      <label htmlFor="material-title">제목</label>
      <input
        id="material-title"
        type="text"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />

      <label htmlFor="material-usage">활용법</label>
      <textarea
        id="material-usage"
        value={form.usageNote}
        onChange={(e) => setForm((f) => ({ ...f, usageNote: e.target.value }))}
      />

      <fieldset>
        <legend>자료 항목</legend>
        <ul>
          {form.resources.map((r, i) => (
            <li key={`${r.url}-${i}`}>
              <span>
                {RESOURCE_TYPE_LABELS[r.type]} · {r.title} · {r.url}
              </span>
              <button type="button" onClick={() => removeResource(i)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
        <label htmlFor="resource-type">종류</label>
        <select
          id="resource-type"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
        >
          <option value="photo">사진</option>
          <option value="video">영상</option>
          <option value="qr">QR</option>
        </select>
        <label htmlFor="resource-title">자료 제목</label>
        <input
          id="resource-title"
          type="text"
          value={resourceTitle}
          onChange={(e) => setResourceTitle(e.target.value)}
        />
        <label htmlFor="resource-url">자료 링크</label>
        <input
          id="resource-url"
          type="text"
          value={resourceUrl}
          onChange={(e) => setResourceUrl(e.target.value)}
        />
        <button type="button" onClick={addResource}>
          자료 항목 추가
        </button>
        {resourceError && <p role="alert">{resourceError}</p>}
      </fieldset>

      <fieldset>
        <legend>연결된 차시</legend>
        <ul>
          {form.lessonRefs.map((ref, i) => (
            <li key={`${ref.lessonId}-${i}`}>
              <span>{lessonRefLabel(ref)}</span>
              <button type="button" onClick={() => removeLessonRef(i)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
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
        <button type="button" onClick={addLessonRef}>
          차시 추가
        </button>
      </fieldset>

      <button type="submit" disabled={!canSave}>
        저장
      </button>
      <button type="button" onClick={onCancel}>
        취소
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  )
}

export default function MaterialsAdminPage() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [mode, setMode] = useState('list')
  const [saveError, setSaveError] = useState('')

  function reload() {
    setLoading(true)
    setLoadError(false)
    fetchAllMaterials()
      .then((list) => {
        setMaterials(list)
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

  async function handleSave(form) {
    setSaveError('')
    try {
      if (mode === 'create') {
        await createMaterial(form)
      } else if (mode && mode.edit) {
        await updateMaterial(mode.edit, form)
      }
      setMode('list')
      reload()
    } catch {
      setSaveError('자료 저장에 실패했어요. 다시 시도해 주세요.')
    }
  }

  async function handleDelete(materialId) {
    await deleteMaterial(materialId)
    reload()
  }

  if (mode === 'create') {
    return (
      <MaterialForm
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
    const editing = materials.find((m) => m.id === mode.edit)
    return (
      <MaterialForm
        initial={editing}
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
    <main className="materials-admin-page">
      <h1>자료 관리</h1>
      <button
        type="button"
        onClick={() => {
          setSaveError('')
          setMode('create')
        }}
      >
        새로 만들기
      </button>
      {loading && <p className="empty-state">불러오는 중...</p>}
      {!loading && loadError && (
        <p className="empty-state">자료 목록을 불러오지 못했어요.</p>
      )}
      {!loading && !loadError && materials.length === 0 && (
        <p className="empty-state">아직 등록된 자료가 없어요.</p>
      )}
      <ul className="materials-list">
        {materials.map((material) => (
          <li key={material.id}>
            <span>{material.title}</span>
            <span>연결된 차시 {material.lessonRefs?.length ?? 0}개</span>
            <button
              type="button"
              onClick={() => {
                setSaveError('')
                setMode({ edit: material.id })
              }}
            >
              수정
            </button>
            <button type="button" onClick={() => handleDelete(material.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
