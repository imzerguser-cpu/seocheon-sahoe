import { describe, it, expect, vi, beforeEach } from 'vitest'
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import {
  fetchAllMaterials,
  fetchMaterialsForLesson,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from './materialsRepo.js'

vi.mock('../firebase.js', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...args) => ({ __collection: args })),
  doc: vi.fn((...args) => ({ __doc: args })),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn((...args) => ({ __query: args })),
  where: vi.fn((...args) => ({ __where: args })),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function fakeSnapshot(docs) {
  return { docs: docs.map((d) => ({ id: d.id, data: () => d.data })) }
}

describe('fetchAllMaterials', () => {
  it('컬렉션의 모든 문서를 id와 함께 반환한다', async () => {
    getDocs.mockResolvedValue(
      fakeSnapshot([{ id: 'm1', data: { title: '자료1' } }, { id: 'm2', data: { title: '자료2' } }]),
    )
    const result = await fetchAllMaterials()
    expect(result).toEqual([
      { id: 'm1', title: '자료1' },
      { id: 'm2', title: '자료2' },
    ])
  })
})

describe('fetchMaterialsForLesson', () => {
  it('lessonIds에 해당 차시가 포함된 문서만 array-contains로 조회한다', async () => {
    getDocs.mockResolvedValue(fakeSnapshot([{ id: 'm1', data: { title: '자료1' } }]))
    const result = await fetchMaterialsForLesson('ecrimedia-u1-t5-l1')
    expect(where).toHaveBeenCalledWith('lessonIds', 'array-contains', 'ecrimedia-u1-t5-l1')
    expect(result).toEqual([{ id: 'm1', title: '자료1' }])
  })
})

describe('createMaterial', () => {
  it('lessonRefs로부터 lessonIds를 계산해서 함께 저장한다', async () => {
    addDoc.mockResolvedValue({ id: 'new-id' })
    const id = await createMaterial({
      title: '자료',
      usageNote: '',
      resources: [],
      lessonRefs: [
        { publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t5-l1' },
        { publisherId: 'chunjae-park', lessonId: 'chunjae-park-u1-t6-l1' },
      ],
    })
    expect(id).toBe('new-id')
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: '자료',
        lessonIds: ['ecrimedia-u1-t5-l1', 'chunjae-park-u1-t6-l1'],
      }),
    )
  })
})

describe('updateMaterial', () => {
  it('lessonIds를 다시 계산해서 문서를 갱신한다', async () => {
    updateDoc.mockResolvedValue()
    await updateMaterial('m1', {
      title: '수정된 자료',
      usageNote: '',
      resources: [],
      lessonRefs: [{ publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t5-l1' }],
    })
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ title: '수정된 자료', lessonIds: ['ecrimedia-u1-t5-l1'] }),
    )
  })
})

describe('deleteMaterial', () => {
  it('해당 id의 문서를 삭제한다', async () => {
    deleteDoc.mockResolvedValue()
    await deleteMaterial('m1')
    expect(deleteDoc).toHaveBeenCalled()
  })
})
