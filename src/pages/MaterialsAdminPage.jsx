import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getPublishers,
  getUnits,
  getTopics,
  getLessons,
  findMatchingLessonsAcrossPublishers,
} from '../lib/dataLoader.js'
import {
  fetchAllMaterials,
  createMaterial,
  updateMaterial,
  proposeMaterialEdit,
  deleteMaterial,
  resolvePendingContent,
} from '../lib/materialsRepo.js'
import { isSafeUrl } from '../components/ResourceCard.jsx'
import { getAdminSession } from '../lib/auth.js'
import { defaultPublisherId } from '../lib/adminPublisher.js'

const RESOURCE_TYPE_LABELS = { photo: '사진', video: '영상', qr: 'QR', file: '파일(PDF/HWP)' }
const emptyForm = { usageNote: '', usageFileUrl: '', resources: [], lessonRefs: [] }

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

function materialSummary(material) {
  const labels = (material.resources ?? []).map(
    (r) => r.title || RESOURCE_TYPE_LABELS[r.type] || r.type,
  )
  return labels.length > 0 ? labels.join(', ') : '(자료 항목 없음)'
}

function statusLabel(material) {
  if (material.status === 'pending') return '검토 대기'
  if (material.pendingChanges) return '수정 제안 검토 중'
  return '게시됨'
}

function PublisherLessonPicker({ publisherId, onPick }) {
  const units = getUnits(publisherId)
  const [openUnitId, setOpenUnitId] = useState(units[0]?.id ?? null)
  const [openTopicId, setOpenTopicId] = useState(null)

  return (
    <div className="publisher-lesson-picker">
      {units.map((unit) => (
        <div key={unit.id} className="publisher-lesson-picker-unit">
          <button
            type="button"
            onClick={() => {
              setOpenUnitId(openUnitId === unit.id ? null : unit.id)
              setOpenTopicId(null)
            }}
          >
            {unit.title}
          </button>
          {openUnitId === unit.id && (
            <ul>
              {getTopics(publisherId, unit.id).map((topic) => (
                <li key={topic.id}>
                  <button
                    type="button"
                    onClick={() => setOpenTopicId(openTopicId === topic.id ? null : topic.id)}
                  >
                    {topic.title}
                  </button>
                  {openTopicId === topic.id && (
                    <ul>
                      {getLessons(publisherId, unit.id, topic.id).map((lesson) => (
                        <li key={lesson.id}>
                          <button type="button" onClick={() => onPick(lesson.id)}>
                            {lesson.차시순서} / {lesson.전체차시}차시 선택
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

export function MaterialForm({ initial, onSave, onCancel, error, willRequireApproval }) {
  const {
    id: _id,
    lessonIds: _lessonIds,
    status: _status,
    submittedBy: _submittedBy,
    pendingChanges: _pendingChanges,
    ...initialWithoutId
  } = initial ?? emptyForm
  const [form, setForm] = useState(initialWithoutId)
  const [resourceType, setResourceType] = useState('photo')
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
  const [resourceError, setResourceError] = useState('')
  const [browsingPublisherId, setBrowsingPublisherId] = useState(null)

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

  function addMatchingLessonRefs() {
    if (!lessonId) return
    const matches = findMatchingLessonsAcrossPublishers(publisherId, unitId, topicId, lessonId)
    setForm((f) => {
      const existingIds = new Set(f.lessonRefs.map((r) => r.lessonId))
      const newRefs = matches
        .filter((m) => !existingIds.has(m.lessonId))
        .map((m) => ({ publisherId: m.publisherId, lessonId: m.lessonId }))
      const selfRef = existingIds.has(lessonId) ? [] : [{ publisherId, lessonId }]
      return { ...f, lessonRefs: [...f.lessonRefs, ...selfRef, ...newRefs] }
    })
  }

  function removeLessonRef(index) {
    setForm((f) => ({ ...f, lessonRefs: f.lessonRefs.filter((_, i) => i !== index) }))
  }

  function setConnectionForPublisher(targetPublisherId, newLessonId) {
    setForm((f) => ({
      ...f,
      lessonRefs: [
        ...f.lessonRefs.filter((r) => r.publisherId !== targetPublisherId),
        { publisherId: targetPublisherId, lessonId: newLessonId },
      ],
    }))
    setBrowsingPublisherId(null)
  }

  const canSave = form.resources.length > 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSave) return
    onSave(form)
  }

  return (
    <main className="materials-admin-page">
      <Link to="/admin" className="back-link">
        ← 관리자 대시보드로
      </Link>
      {willRequireApproval && (
        <p className="approval-notice">
          이 내용은 저장해도 바로 반영되지 않아요. 전체 관리자가 확인한 뒤에 학생과 다른 교사에게
          보여요.
        </p>
      )}
      <form onSubmit={handleSubmit} className="material-form">
      <label htmlFor="material-usage">활용법 (교사에게만 보여요)</label>
      <textarea
        id="material-usage"
        value={form.usageNote}
        onChange={(e) => setForm((f) => ({ ...f, usageNote: e.target.value }))}
      />

      <label htmlFor="material-usage-file">활용법 파일(PDF/HWP) 링크 (교사에게만 보여요)</label>
      <input
        id="material-usage-file"
        type="text"
        value={form.usageFileUrl}
        onChange={(e) => setForm((f) => ({ ...f, usageFileUrl: e.target.value }))}
        placeholder="구글 드라이브 등 공유 링크"
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
          <option value="file">파일(PDF/HWP)</option>
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
        <legend>기준 차시 선택 (자동 연결용)</legend>
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
        <button type="button" onClick={addLessonRef}>
          차시 추가
        </button>
        <button type="button" onClick={addMatchingLessonRefs}>
          다른 출판사도 자동 연결
        </button>
        <p className="field-hint">
          현재 선택된 차시와 진도표상 순서가 같은 학습주제를 다른 7개 출판사에서 찾아
          한 번에 연결해요. 잘못 연결된 항목은 아래 "출판사별 연결 현황"에서 고치세요.
        </p>
      </fieldset>

      <fieldset>
        <legend>출판사별 연결 현황</legend>
        {publishers.map((p) => {
          const refsForPublisher = form.lessonRefs
            .map((ref, index) => ({ ...ref, index }))
            .filter((ref) => ref.publisherId === p.id)
          const isBrowsing = browsingPublisherId === p.id
          return (
            <div key={p.id} className="publisher-connection-row">
              <span className="publisher-connection-name">{p.name}</span>
              {refsForPublisher.length === 0 ? (
                <span className="publisher-connection-empty">연결 안 됨</span>
              ) : (
                <ul className="publisher-connection-refs">
                  {refsForPublisher.map((ref) => (
                    <li key={`${ref.lessonId}-${ref.index}`}>
                      <span>{lessonRefLabel(ref)}</span>
                      <button type="button" onClick={() => removeLessonRef(ref.index)}>
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                aria-expanded={isBrowsing}
                onClick={() => setBrowsingPublisherId(isBrowsing ? null : p.id)}
              >
                {isBrowsing ? '학습주제 목록 닫기' : '학습주제 전체 보기'}
              </button>
              {isBrowsing && (
                <PublisherLessonPicker
                  publisherId={p.id}
                  onPick={(newLessonId) => setConnectionForPublisher(p.id, newLessonId)}
                />
              )}
            </div>
          )
        })}
      </fieldset>

      <button type="submit" disabled={!canSave}>
        저장
      </button>
      <button type="button" onClick={onCancel}>
        취소
      </button>
      {!canSave && <p className="field-hint">자료 항목을 하나 이상 추가해야 저장할 수 있어요.</p>}
      {error && <p role="alert">{error}</p>}
      </form>
    </main>
  )
}

export default function MaterialsAdminPage() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [mode, setMode] = useState('list')
  const [saveError, setSaveError] = useState('')
  const [saveNotice, setSaveNotice] = useState('')

  const adminSession = getAdminSession()
  const isSuperAdmin = adminSession?.role === 'super-admin'
  const submittedBy = isSuperAdmin
    ? null
    : {
        schoolId: adminSession?.schoolId ?? '',
        schoolName: adminSession?.schoolName ?? '',
        teacherName: adminSession?.teacherName ?? '',
      }

  const publishers = getPublishers()
  const [browsePublisherId, setBrowsePublisherId] = useState(() =>
    defaultPublisherId(publishers, 'chunjae-park'),
  )
  const browseUnits = getUnits(browsePublisherId)
  const [browseUnitId, setBrowseUnitId] = useState(browseUnits[0]?.id ?? '')
  const [expandedTopicId, setExpandedTopicId] = useState(null)
  const browseTopics = getTopics(browsePublisherId, browseUnitId)

  function materialsForTopic(topicId) {
    const lessonIds = getLessons(browsePublisherId, browseUnitId, topicId).map((l) => l.id)
    return materials.filter((m) =>
      (m.lessonRefs ?? []).some(
        (ref) => ref.publisherId === browsePublisherId && lessonIds.includes(ref.lessonId),
      ),
    )
  }

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

  function editingWillRequireApproval(editing) {
    return !isSuperAdmin && editing?.status === 'published'
  }

  async function handleSave(form) {
    setSaveError('')
    try {
      if (mode === 'create') {
        if (isSuperAdmin) {
          await createMaterial(form)
        } else {
          await createMaterial(form, { status: 'pending', submittedBy })
          setSaveNotice('검토 요청을 보냈어요. 전체 관리자가 확인 후 학생·다른 교사에게 보이게 반영해요.')
        }
      } else if (mode && mode.edit) {
        const editing = materials.find((m) => m.id === mode.edit)
        if (editingWillRequireApproval(editing)) {
          await proposeMaterialEdit(mode.edit, form, submittedBy)
          setSaveNotice('수정 요청을 보냈어요. 전체 관리자가 확인 후 반영해요.')
        } else {
          await updateMaterial(mode.edit, form)
        }
      }
      setMode('list')
      reload()
    } catch {
      setSaveError('자료 저장에 실패했어요. 다시 시도해 주세요.')
    }
  }

  async function handleDelete(materialId) {
    if (!window.confirm('이 자료를 삭제할까요? 되돌릴 수 없어요.')) return
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
        willRequireApproval={!isSuperAdmin}
      />
    )
  }

  if (mode && mode.edit) {
    const editing = materials.find((m) => m.id === mode.edit)
    return (
      <MaterialForm
        initial={resolvePendingContent(editing)}
        onSave={handleSave}
        onCancel={() => {
          setSaveError('')
          setMode('list')
        }}
        error={saveError}
        willRequireApproval={editingWillRequireApproval(editing)}
      />
    )
  }

  return (
    <main className="materials-admin-page">
      <Link to="/admin" className="back-link">
        ← 관리자 대시보드로
      </Link>
      <h1>자료 관리</h1>
      <button
        type="button"
        onClick={() => {
          setSaveError('')
          setSaveNotice('')
          setMode('create')
        }}
      >
        새로 만들기
      </button>
      {saveNotice && <p className="save-notice">{saveNotice}</p>}
      {loading && <p className="empty-state">불러오는 중...</p>}
      {!loading && loadError && (
        <p className="empty-state">자료 목록을 불러오지 못했어요.</p>
      )}

      {!loading && !loadError && (
        <>
          <label htmlFor="browse-publisher-select">출판사</label>
          <select
            id="browse-publisher-select"
            value={browsePublisherId}
            onChange={(e) => {
              const newPublisherId = e.target.value
              setBrowsePublisherId(newPublisherId)
              setBrowseUnitId(getUnits(newPublisherId)[0]?.id ?? '')
              setExpandedTopicId(null)
            }}
          >
            {publishers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <label htmlFor="browse-unit-select">대단원</label>
          <select
            id="browse-unit-select"
            value={browseUnitId}
            onChange={(e) => {
              setBrowseUnitId(e.target.value)
              setExpandedTopicId(null)
            }}
          >
            {browseUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.title}
              </option>
            ))}
          </select>

          {materials.length === 0 && (
            <p className="empty-state">아직 등록된 자료가 없어요.</p>
          )}

          <ul className="topic-accordion-list">
            {browseTopics.map((topic) => {
              const topicMaterials = materialsForTopic(topic.id)
              const expanded = expandedTopicId === topic.id
              return (
                <li key={topic.id} className="topic-accordion-item">
                  <button
                    type="button"
                    className="topic-accordion-header"
                    aria-expanded={expanded}
                    onClick={() => setExpandedTopicId(expanded ? null : topic.id)}
                  >
                    {topic.title} ({topicMaterials.length})
                  </button>
                  {expanded && (
                    <ul className="materials-list">
                      {topicMaterials.length === 0 && (
                        <li className="empty-state">이 학습주제에는 아직 등록된 자료가 없어요.</li>
                      )}
                      {topicMaterials.map((material) => (
                        <li key={material.id}>
                          <span className="status-badge">{statusLabel(material)}</span>
                          <span>{materialSummary(material)}</span>
                          <span>연결된 차시 {material.lessonRefs?.length ?? 0}개</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSaveError('')
                              setSaveNotice('')
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
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </main>
  )
}
