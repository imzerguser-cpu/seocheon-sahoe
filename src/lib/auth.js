const SESSION_KEY = 'seocheon-sahoe:session'

export function saveSession(role) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ role, unlockedAt: Date.now() }))
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function isUnlocked() {
  return getSession() !== null
}

export function matchPasscode(accessConfig, inputPasscode) {
  if (!accessConfig || !inputPasscode) return null
  if (inputPasscode === accessConfig.teacherPasscode) return 'teacher'
  if (inputPasscode === accessConfig.studentPasscode) return 'student'
  return null
}
