import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase.js'

const COLLECTION = 'quizzes'

export async function fetchQuestions(scope, refId) {
  const q = query(
    collection(db, COLLECTION),
    where('scope', '==', scope),
    where('refId', '==', refId),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createQuestion(questionData) {
  const ref = await addDoc(collection(db, COLLECTION), questionData)
  return ref.id
}

export async function updateQuestion(questionId, questionData) {
  await setDoc(doc(db, COLLECTION, questionId), questionData)
}

export async function deleteQuestion(questionId) {
  await deleteDoc(doc(db, COLLECTION, questionId))
}
