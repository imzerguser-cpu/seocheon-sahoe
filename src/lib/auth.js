import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { app } from '../firebase.js'

const SESSION_KEY = 'seocheon-sahoe:session'
const ADMIN_SESSION_KEY = 'seocheon-sahoe:admin-session'
const ADMIN_ROLES = ['school-admin', 'super-admin']

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

export function saveAdminSession(session) {
  const normalized = typeof session === 'string' ? { role: session } : session
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(normalized))
}

export function getAdminSession() {
  const raw = localStorage.getItem(ADMIN_SESSION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !ADMIN_ROLES.includes(parsed.role)) return null
    return parsed
  } catch {
    return null
  }
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

export function matchSchool(schools, schoolId, inputPassword, passwords) {
  const school = schools.find((s) => s.id === schoolId)
  if (!school || !inputPassword) return null
  if (inputPassword !== passwords?.[schoolId]) return null
  return school
}

export async function signInSuperAdmin(email, password) {
  try {
    await signInWithEmailAndPassword(getAuth(app), email, password)
    return true
  } catch {
    return false
  }
}

export async function signOutSuperAdmin() {
  await signOut(getAuth(app))
}
