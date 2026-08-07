import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
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

export async function fetchAllQuestions() {
  const snap = await getDocs(collection(db, COLLECTION))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// New quizzes default to visible:true and status:published (admin-created)
// unless the caller overrides them — e.g. a student/teacher submission passes
// status:'pending' + submittedBy so it stays invisible until approved.
export async function createQuestion(questionData, { status = 'published', submittedBy = null } = {}) {
  const ref = await addDoc(collection(db, COLLECTION), {
    visible: true,
    ...questionData,
    status,
    submittedBy,
  })
  return ref.id
}

export async function updateQuestion(questionId, questionData) {
  await setDoc(doc(db, COLLECTION, questionId), questionData)
}

// Quick per-quiz toggle for whether students can see it — a partial update so
// the rest of the question document is left untouched.
export async function setQuestionVisibility(questionId, visible) {
  await updateDoc(doc(db, COLLECTION, questionId), { visible })
}

// Super-admin/school-admin approval of a student/teacher submission — applies
// the (possibly reviewer-edited) content and flips status to published in one
// write. submittedBy should be passed through unchanged so the origin stays
// visible to other students after approval.
export async function publishQuestion(questionId, questionData) {
  await setDoc(doc(db, COLLECTION, questionId), { ...questionData, status: 'published' })
}

export async function deleteQuestion(questionId) {
  await deleteDoc(doc(db, COLLECTION, questionId))
}
