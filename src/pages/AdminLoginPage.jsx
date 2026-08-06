import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import adminConfig from '../data/adminConfig.json'
import { matchAdminPassword, saveAdminSession } from '../lib/auth.js'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!matchAdminPassword(adminConfig, password)) {
      setError('비밀번호가 올바르지 않아요. 다시 확인해 주세요.')
      return
    }
    saveAdminSession()
    navigate('/admin')
  }

  return (
    <main className="admin-login-page">
      <h1>관리자 로그인</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="admin-password">비밀번호</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">로그인</button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  )
}
