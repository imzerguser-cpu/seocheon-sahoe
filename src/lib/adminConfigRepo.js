import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

// Legacy single shared 학교관리자 password. No longer editable directly —
// kept only as a one-time seed source for the per-school admin passwords in
// schoolPasswordsRepo.js.
export async function fetchAdminConfig() {
  const snap = await getDoc(doc(db, 'adminConfig', 'main'))
  return snap.exists() ? snap.data() : null
}
