import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

export async function fetchAccessConfig() {
  const snap = await getDoc(doc(db, 'config', 'access'))
  if (!snap.exists()) return null
  return snap.data()
}
