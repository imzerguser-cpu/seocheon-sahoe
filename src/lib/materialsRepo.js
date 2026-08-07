import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../firebase.js'

const COLLECTION = 'materials'

function toLessonIds(lessonRefs) {
  return lessonRefs.map((ref) => ref.lessonId)
}

export async function fetchAllMaterials() {
  const snap = await getDocs(collection(db, COLLECTION))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function fetchMaterialsForLesson(lessonId) {
  const q = query(collection(db, COLLECTION), where('lessonIds', 'array-contains', lessonId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createMaterial(material) {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...material,
    lessonIds: toLessonIds(material.lessonRefs ?? []),
  })
  return ref.id
}

export async function updateMaterial(materialId, material) {
  await updateDoc(doc(db, COLLECTION, materialId), {
    ...material,
    lessonIds: toLessonIds(material.lessonRefs ?? []),
  })
}

export async function deleteMaterial(materialId) {
  await deleteDoc(doc(db, COLLECTION, materialId))
}
