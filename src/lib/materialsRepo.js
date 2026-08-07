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
  const q = query(
    collection(db, COLLECTION),
    where('lessonIds', 'array-contains', lessonId),
    where('status', '==', 'published'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createMaterial(material, { status = 'published', submittedBy = null } = {}) {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...material,
    lessonIds: toLessonIds(material.lessonRefs ?? []),
    status,
    submittedBy,
    pendingChanges: null,
  })
  return ref.id
}

// Applies changes directly to the live document. Used by super-admins for any
// edit, and by school-admins editing their own not-yet-published ('pending')
// draft — in both cases there's nothing already visible to anyone else yet.
export async function updateMaterial(materialId, material) {
  await updateDoc(doc(db, COLLECTION, materialId), {
    ...material,
    lessonIds: toLessonIds(material.lessonRefs ?? []),
  })
}

// A school-admin editing an ALREADY-published material can't apply the edit
// directly — it's staged as pendingChanges so the live (visible) fields stay
// untouched until a super-admin reviews and publishes it via publishMaterial.
export async function proposeMaterialEdit(materialId, material, submittedBy) {
  await updateDoc(doc(db, COLLECTION, materialId), {
    pendingChanges: { ...material, lessonIds: toLessonIds(material.lessonRefs ?? []) },
    submittedBy,
  })
}

// Super-admin approval: makes `material` the live, published content and
// clears any staged pendingChanges — used both for a brand-new pending
// submission and for an edit proposal on an already-published material.
export async function publishMaterial(materialId, material) {
  await updateDoc(doc(db, COLLECTION, materialId), {
    ...material,
    lessonIds: toLessonIds(material.lessonRefs ?? []),
    status: 'published',
    pendingChanges: null,
  })
}

// Discards a staged edit proposal, leaving the currently-live material as-is.
export async function rejectMaterialEdit(materialId) {
  await updateDoc(doc(db, COLLECTION, materialId), { pendingChanges: null })
}

export async function deleteMaterial(materialId) {
  await deleteDoc(doc(db, COLLECTION, materialId))
}

// The content an admin should actually edit: a staged edit proposal takes
// priority over the (possibly stale, already-live) top-level fields so a
// school-admin resuming their own draft, or a super-admin reviewing it,
// always sees the latest proposed version rather than the old live one.
export function resolvePendingContent(material) {
  if (!material) return null
  return material.pendingChanges ? { ...material, ...material.pendingChanges } : material
}
