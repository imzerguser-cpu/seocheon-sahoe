import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../firebase.js'

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

export function saveAdminSession(role) {
  localStorage.setItem(ADMIN_SESSION_KEY, role)
}

export function getAdminSession() {
  const role = localStorage.getItem(ADMIN_SESSION_KEY)
  return ADMIN_ROLES.includes(role) ? role : null
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

export async function signInSuperAdmin(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password)
    return true
  } catch {
    return false
  }
}

export async function signOutSuperAdmin() {
  await signOut(auth)
}
