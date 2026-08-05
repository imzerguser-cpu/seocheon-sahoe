import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { fetchAccessConfig } from '../lib/accessConfig.js'
import { matchPasscode } from '../lib/auth.js'

export default function LoginPage() {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const config = await fetchAccessConfig()
      const role = matchPasscode(config, passcode)
      if (!role) {
        setError('비밀번호가 올바르지 않아요. 다시 확인해 주세요.')
        return
      }
      login(role)
      navigate('/')
    } catch {
      setError('접속 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <h1>우리 고장 서천 지역화 자료</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="passcode">비밀번호</label>
        <input
          id="passcode"
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="선생님 또는 학생 비밀번호를 입력하세요"
        />
        <button type="submit" disabled={loading}>
          {loading ? '확인 중...' : '입장하기'}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  )
}
