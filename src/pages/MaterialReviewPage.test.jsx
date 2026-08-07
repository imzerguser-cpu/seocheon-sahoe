import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import MaterialReviewPage from './MaterialReviewPage.jsx'

function renderPage() {
  return render(
    <MemoryRouter>
      <MaterialReviewPage />
    </MemoryRouter>,
  )
}

vi.mock('../lib/materialsRepo.js', async () => {
  const actual = await vi.importActual('../lib/materialsRepo.js')
  return {
    fetchAllMaterials: vi.fn(),
    publishMaterial: vi.fn(),
    rejectMaterialEdit: vi.fn(),
    deleteMaterial: vi.fn(),
    resolvePendingContent: actual.resolvePendingContent,
  }
})

import {
  fetchAllMaterials,
  publishMaterial,
  rejectMaterialEdit,
  deleteMaterial,
} from '../lib/materialsRepo.js'

const publishedMaterial = {
  id: 'm-live',
  status: 'published',
  submittedBy: null,
  usageNote: '',
  usageFileUrl: '',
  resources: [{ type: 'photo', title: '게시된 자료', url: 'https://example.com/live.jpg' }],
  lessonRefs: [],
}

const newSubmission = {
  id: 'm-new',
  status: 'pending',
  submittedBy: { schoolId: 'songlim-cho', schoolName: '송림초', teacherName: '김선생' },
  usageNote: '',
  usageFileUrl: '',
  resources: [{ type: 'photo', title: '새로 올라온 자료', url: 'https://example.com/new.jpg' }],
  lessonRefs: [],
}

const editProposal = {
  id: 'm-edit',
  status: 'published',
  submittedBy: { schoolId: 'jangang-cho', schoolName: '장항초', teacherName: '박선생' },
  usageNote: '기존 활용법',
  usageFileUrl: '',
  resources: [{ type: 'photo', title: '기존 자료', url: 'https://example.com/edit-old.jpg' }],
  lessonRefs: [],
  pendingChanges: {
    usageNote: '제안된 활용법',
    usageFileUrl: '',
    resources: [{ type: 'photo', title: '제안된 자료', url: 'https://example.com/edit-new.jpg' }],
    lessonRefs: [],
    lessonIds: [],
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('MaterialReviewPage', () => {
  it('게시된(검토 불필요) 자료는 목록에서 빠지고, 새 등록/수정 제안만 보인다', async () => {
    fetchAllMaterials.mockResolvedValue([publishedMaterial, newSubmission, editProposal])
    renderPage()

    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())
    expect(screen.queryByText(/게시된 자료/)).not.toBeInTheDocument()
    expect(screen.getByText('새 자료 등록 요청')).toBeInTheDocument()
    expect(screen.getByText('기존 자료 수정 요청')).toBeInTheDocument()
  })

  it('제출자(학교·담당자)를 표시한다', async () => {
    fetchAllMaterials.mockResolvedValue([newSubmission, editProposal])
    renderPage()

    await waitFor(() => expect(screen.getByText('송림초 · 김선생')).toBeInTheDocument())
    expect(screen.getByText('장항초 · 박선생')).toBeInTheDocument()
  })

  it('요청이 없으면 안내 문구를 보여준다', async () => {
    fetchAllMaterials.mockResolvedValue([publishedMaterial])
    renderPage()

    await waitFor(() => expect(screen.getByText('검토할 요청이 없어요.')).toBeInTheDocument())
  })

  it('새 등록 요청을 검토하기로 열면 제출된 내용이 채워진 폼이 보이고, 반영하면 status:published로 publishMaterial이 호출된다', async () => {
    fetchAllMaterials.mockResolvedValue([newSubmission])
    publishMaterial.mockResolvedValue()
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '검토하기' }))
    expect(screen.getByText(/새로 올라온 자료/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(publishMaterial).toHaveBeenCalledWith(
        'm-new',
        expect.objectContaining({
          resources: [{ type: 'photo', title: '새로 올라온 자료', url: 'https://example.com/new.jpg' }],
        }),
      ),
    )
  })

  it('수정 제안을 검토하기로 열면 pendingChanges 내용(제안된 내용)이 채워진 폼이 보인다', async () => {
    fetchAllMaterials.mockResolvedValue([editProposal])
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '검토하기' }))
    expect(screen.getByLabelText('활용법 (교사에게만 보여요)')).toHaveValue('제안된 활용법')
    expect(screen.getByText(/제안된 자료/)).toBeInTheDocument()
    expect(screen.queryByText(/기존 자료/)).not.toBeInTheDocument()
  })

  it('새 등록 요청을 반려하면 deleteMaterial이 호출된다', async () => {
    fetchAllMaterials.mockResolvedValue([newSubmission])
    deleteMaterial.mockResolvedValue()
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '반려' }))

    await waitFor(() => expect(deleteMaterial).toHaveBeenCalledWith('m-new'))
    expect(rejectMaterialEdit).not.toHaveBeenCalled()
  })

  it('수정 제안을 반려하면 rejectMaterialEdit이 호출되고 게시된 자료는 삭제되지 않는다', async () => {
    fetchAllMaterials.mockResolvedValue([editProposal])
    rejectMaterialEdit.mockResolvedValue()
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '반려' }))

    await waitFor(() => expect(rejectMaterialEdit).toHaveBeenCalledWith('m-edit'))
    expect(deleteMaterial).not.toHaveBeenCalled()
  })

  it('반려 확인 창에서 취소하면 아무 것도 호출되지 않는다', async () => {
    window.confirm.mockReturnValue(false)
    fetchAllMaterials.mockResolvedValue([newSubmission])
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '반려' }))

    expect(deleteMaterial).not.toHaveBeenCalled()
    expect(rejectMaterialEdit).not.toHaveBeenCalled()
  })

  it('목록을 불러오지 못하면 에러 메시지를 보여준다', async () => {
    fetchAllMaterials.mockRejectedValue(new Error('network error'))
    renderPage()

    await waitFor(() => expect(screen.getByText('목록을 불러오지 못했어요.')).toBeInTheDocument())
  })

  it('관리자 대시보드로 가는 뒤로가기 링크를 보여준다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    renderPage()
    expect(screen.getByRole('link', { name: '← 관리자 대시보드로' })).toHaveAttribute(
      'href',
      '/admin',
    )
  })
})
