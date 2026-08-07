import { describe, it, expect, vi, beforeEach } from 'vitest'
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import {
  fetchAllMaterials,
  fetchMaterialsForLesson,
  createMaterial,
  updateMaterial,
  proposeMaterialEdit,
  publishMaterial,
  rejectMaterialEdit,
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
      fakeSnapshot([{ id: 'm1', data: { usageNote: '자료1' } }, { id: 'm2', data: { usageNote: '자료2' } }]),
    )
    const result = await fetchAllMaterials()
    expect(result).toEqual([
      { id: 'm1', usageNote: '자료1' },
      { id: 'm2', usageNote: '자료2' },
    ])
  })
})

describe('fetchMaterialsForLesson', () => {
  it('lessonIds에 해당 차시가 포함되고 status가 published인 문서만 조회한다', async () => {
    getDocs.mockResolvedValue(fakeSnapshot([{ id: 'm1', data: { usageNote: '자료1' } }]))
    const result = await fetchMaterialsForLesson('ecrimedia-u1-t5-l1')
    expect(where).toHaveBeenCalledWith('lessonIds', 'array-contains', 'ecrimedia-u1-t5-l1')
    expect(where).toHaveBeenCalledWith('status', '==', 'published')
    expect(result).toEqual([{ id: 'm1', usageNote: '자료1' }])
  })
})

describe('createMaterial', () => {
  it('기본값(옵션 없음)은 status:published, submittedBy:null로 저장한다', async () => {
    addDoc.mockResolvedValue({ id: 'new-id' })
    const id = await createMaterial({
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
        lessonIds: ['ecrimedia-u1-t5-l1', 'chunjae-park-u1-t6-l1'],
        status: 'published',
        submittedBy: null,
        pendingChanges: null,
      }),
    )
  })

  it('학교관리자 제출은 status:pending과 submittedBy를 함께 저장한다', async () => {
    addDoc.mockResolvedValue({ id: 'new-id' })
    const submittedBy = { schoolId: 'songlim-cho', schoolName: '송림초', teacherName: '김선생' }
    await createMaterial(
      { usageNote: '', resources: [], lessonRefs: [] },
      { status: 'pending', submittedBy },
    )
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'pending', submittedBy }),
    )
  })
})

describe('updateMaterial', () => {
  it('lessonIds를 다시 계산해서 문서를 직접 갱신한다', async () => {
    updateDoc.mockResolvedValue()
    await updateMaterial('m1', {
      usageNote: '수정된 자료',
      resources: [],
      lessonRefs: [{ publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t5-l1' }],
    })
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ usageNote: '수정된 자료', lessonIds: ['ecrimedia-u1-t5-l1'] }),
    )
  })
})

describe('proposeMaterialEdit', () => {
  it('live 필드는 건드리지 않고 pendingChanges와 submittedBy만 갱신한다', async () => {
    updateDoc.mockResolvedValue()
    const submittedBy = { schoolId: 'songlim-cho', schoolName: '송림초', teacherName: '김선생' }
    await proposeMaterialEdit(
      'm1',
      { usageNote: '제안된 내용', resources: [], lessonRefs: [{ publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t5-l1' }] },
      submittedBy,
    )
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
      pendingChanges: {
        usageNote: '제안된 내용',
        resources: [],
        lessonRefs: [{ publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t5-l1' }],
        lessonIds: ['ecrimedia-u1-t5-l1'],
      },
      submittedBy,
    })
  })
})

describe('publishMaterial', () => {
  it('전달된 내용을 live 필드로 반영하고 status를 published로, pendingChanges를 null로 만든다', async () => {
    updateDoc.mockResolvedValue()
    await publishMaterial('m1', {
      usageNote: '승인된 내용',
      resources: [],
      lessonRefs: [{ publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t5-l1' }],
    })
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        usageNote: '승인된 내용',
        lessonIds: ['ecrimedia-u1-t5-l1'],
        status: 'published',
        pendingChanges: null,
      }),
    )
  })
})

describe('rejectMaterialEdit', () => {
  it('pendingChanges만 지우고 다른 필드는 건드리지 않는다', async () => {
    updateDoc.mockResolvedValue()
    await rejectMaterialEdit('m1')
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { pendingChanges: null })
  })
})

describe('deleteMaterial', () => {
  it('해당 id의 문서를 삭제한다', async () => {
    deleteDoc.mockResolvedValue()
    await deleteMaterial('m1')
    expect(deleteDoc).toHaveBeenCalled()
  })
})
