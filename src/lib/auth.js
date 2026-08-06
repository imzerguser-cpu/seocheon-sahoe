const SESSION_KEY = 'seocheon-sahoe:session'
const ADMIN_SESSION_KEY = 'seocheon-sahoe:admin-session'

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.schoolId) return null
    return parsed
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function saveAdminSession() {
  localStorage.setItem(ADMIN_SESSION_KEY, 'true')
}

export function getAdminSession() {
  return localStorage.getItem(ADMIN_SESSION_KEY) === 'true'
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

export function matchSchool(schools, schoolId, inputPassword) {
  const school = schools.find((s) => s.id === schoolId)
  if (!school || !inputPassword) return null
  if (inputPassword !== school.password) return null
  return school
}

export function matchAdminPassword(adminConfig, inputPassword) {
  if (!adminConfig || !inputPassword) return false
  return inputPassword === adminConfig.password
}
