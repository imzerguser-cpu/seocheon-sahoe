import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchAllMaterials,
  publishMaterial,
  rejectMaterialEdit,
  deleteMaterial,
  resolvePendingContent,
} from '../lib/materialsRepo.js'
import { MaterialForm } from './MaterialsAdminPage.jsx'

function submittedByLabel(material) {
  const by = material.submittedBy
  if (!by) return '제출자 정보 없음'
  return `${by.schoolName || by.schoolId} · ${by.teacherName}`
}

function kindLabel(material) {
  return material.status === 'pending' ? '새 자료 등록 요청' : '기존 자료 수정 요청'
}

export default function MaterialReviewPage() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reviewingId, setReviewingId] = useState(null)
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

  const pendingMaterials = materials.filter((m) => m.status === 'pending' || m.pendingChanges)

  async function handlePublish(form) {
    setSaveError('')
    try {
      await publishMaterial(reviewingId, form)
      setReviewingId(null)
      reload()
    } catch {
      setSaveError('반영에 실패했어요. 다시 시도해 주세요.')
    }
  }

  async function handleReject(material) {
    if (!window.confirm('이 요청을 반려할까요? 되돌릴 수 없어요.')) return
    if (material.status === 'pending') {
      await deleteMaterial(material.id)
    } else {
      await rejectMaterialEdit(material.id)
    }
    reload()
  }

  if (reviewingId) {
    const reviewing = materials.find((m) => m.id === reviewingId)
    return (
      <MaterialForm
        initial={resolvePendingContent(reviewing)}
        onSave={handlePublish}
        onCancel={() => {
          setSaveError('')
          setReviewingId(null)
        }}
        error={saveError}
        willRequireApproval={false}
      />
    )
  }

  return (
    <main className="materials-admin-page">
      <Link to="/admin" className="back-link">
        ← 관리자 대시보드로
      </Link>
      <h1>검토 대기 자료</h1>
      {loading && <p className="empty-state">불러오는 중...</p>}
      {!loading && loadError && <p className="empty-state">목록을 불러오지 못했어요.</p>}
      {!loading && !loadError && pendingMaterials.length === 0 && (
        <p className="empty-state">검토할 요청이 없어요.</p>
      )}
      <ul className="materials-list">
        {pendingMaterials.map((material) => (
          <li key={material.id}>
            <span className="status-badge">{kindLabel(material)}</span>
            <span>{submittedByLabel(material)}</span>
            <button
              type="button"
              onClick={() => {
                setSaveError('')
                setReviewingId(material.id)
              }}
            >
              검토하기
            </button>
            <button type="button" onClick={() => handleReject(material)}>
              반려
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
