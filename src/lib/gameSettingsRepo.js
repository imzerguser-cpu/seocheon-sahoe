import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

const DOC_PATH = ['gameSettings', 'main']

// 학교별로 학생들에게 "지식의 성" 게임을 보여 줄지 정하는 설정.
// 문서 모양: { [schoolId]: true | false }. 값이 없으면 꺼진 것으로 본다
// (관리자가 직접 켜기 전까지는 학생에게 보이지 않는다).
export async function fetchGameSettings() {
  const snap = await getDoc(doc(db, ...DOC_PATH))
  return snap.exists() ? snap.data() : {}
}

export async function setGameEnabled(schoolId, enabled) {
  await setDoc(doc(db, ...DOC_PATH), { [schoolId]: enabled }, { merge: true })
}

export function isGameEnabled(settings, schoolId) {
  return settings?.[schoolId] === true
}
