import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import schools from '../data/schools.json'
import { fetchAdminConfig } from './adminConfigRepo.js'

const DOC_PATH = ['schoolPasswords', 'main']
const ADMIN_DOC_PATH = ['schoolAdminPasswords', 'main']

// Student-login passwords live in Firestore so school-admins/super-admins can
// view and change them at runtime. On first ever read (nothing seeded yet),
// this bootstraps the document from the bundled schools.json defaults so no
// manual Firebase-console setup is needed.
export async function fetchSchoolPasswords() {
  const ref = doc(db, ...DOC_PATH)
  const snap = await getDoc(ref)
  if (snap.exists()) return snap.data()
  const defaults = Object.fromEntries(schools.map((s) => [s.id, s.password]))
  await setDoc(ref, defaults)
  return defaults
}

export async function updateSchoolPassword(schoolId, newPassword) {
  await setDoc(doc(db, ...DOC_PATH), { [schoolId]: newPassword }, { merge: true })
}

// School-admin (teacher) login passwords, kept separate from student-login
// passwords per school. On first ever read, seeds every school with whatever
// the old single shared 학교관리자 password (adminConfig) was, so nobody's
// existing password stops working the moment this rolls out.
export async function fetchSchoolAdminPasswords() {
  const ref = doc(db, ...ADMIN_DOC_PATH)
  const snap = await getDoc(ref)
  if (snap.exists()) return snap.data()
  const adminConfig = await fetchAdminConfig()
  const fallbackPassword = adminConfig?.password ?? ''
  const defaults = Object.fromEntries(schools.map((s) => [s.id, fallbackPassword]))
  await setDoc(ref, defaults)
  return defaults
}

export async function updateSchoolAdminPassword(schoolId, newPassword) {
  await setDoc(doc(db, ...ADMIN_DOC_PATH), { [schoolId]: newPassword }, { merge: true })
}
