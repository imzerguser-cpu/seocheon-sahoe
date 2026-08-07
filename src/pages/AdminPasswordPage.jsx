import { useState } from 'react'
import { updateAdminPassword } from '../lib/adminConfigRepo.js'

export default function AdminPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setStatus('')
    setSubmitting(true)
    try {
      await updateAdminPassword(newPassword)
      setStatus('학교관리자 비밀번호가 변경되었어요.')
      setNewPassword('')
    } catch {
      setError('비밀번호 변경에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-password-page">
      <h1>학교관리자 비밀번호 변경</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="new-password">새 비밀번호</label>
        <input
          id="new-password"
          type="text"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button type="submit" disabled={submitting || !newPassword}>
          저장
        </button>
      </form>
      {status && <p role="status">{status}</p>}
      {error && <p role="alert">{error}</p>}
    </main>
  )
}
