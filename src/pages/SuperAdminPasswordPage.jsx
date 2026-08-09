import { useState } from 'react'
import { Link } from 'react-router-dom'
import { changeSuperAdminPassword } from '../lib/auth.js'

export default function SuperAdminPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 서로 달라요. 다시 확인해 주세요.')
      return
    }
    setSubmitting(true)
    try {
      await changeSuperAdminPassword(currentPassword, newPassword)
      setSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setError('현재 비밀번호를 확인해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="super-admin-password-page">
      <Link to="/admin" className="back-link">
        ← 관리자 대시보드로
      </Link>
      <h1>전체관리자 비밀번호 변경</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="current-password">현재 비밀번호</label>
        <input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <label htmlFor="new-password">새 비밀번호</label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <label htmlFor="confirm-password">새 비밀번호 확인</label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button type="submit" disabled={submitting}>
          저장
        </button>
        {error && <p role="alert">{error}</p>}
        {saved && <p role="status">비밀번호를 바꿨어요.</p>}
      </form>
    </main>
  )
}
