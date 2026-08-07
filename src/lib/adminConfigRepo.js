import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

export async function fetchAdminConfig() {
  const snap = await getDoc(doc(db, 'adminConfig', 'main'))
  return snap.exists() ? snap.data() : null
}

export async function updateAdminPassword(newPassword) {
  await setDoc(doc(db, 'adminConfig', 'main'), { password: newPassword })
}
