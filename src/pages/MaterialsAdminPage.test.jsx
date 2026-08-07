import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import MaterialsAdminPage from './MaterialsAdminPage.jsx'
import { saveAdminSession } from '../lib/auth.js'

function renderPage() {
  return render(
    <MemoryRouter>
      <MaterialsAdminPage />
    </MemoryRouter>,
  )
}

vi.mock('../lib/materialsRepo.js', async () => {
  const actual = await vi.importActual('../lib/materialsRepo.js')
  return {
    fetchAllMaterials: vi.fn(),
    createMaterial: vi.fn(),
    updateMaterial: vi.fn(),
    proposeMaterialEdit: vi.fn(),
    deleteMaterial: vi.fn(),
    resolvePendingContent: actual.resolvePendingContent,
  }
})

import {
  fetchAllMaterials,
  createMaterial,
  updateMaterial,
  proposeMaterialEdit,
  deleteMaterial,
} from '../lib/materialsRepo.js'

const sampleMaterial = {
  id: 'm1',
  usageNote: '체험학습 전 사전 안내용',
  usageFileUrl: '',
  status: 'published',
  submittedBy: null,
  resources: [{ type: 'photo', title: '갈대밭 전경', url: 'https://example.com/photo.jpg' }],
  lessonRefs: [{ publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t2-l1' }],
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  saveAdminSession({ role: 'super-admin' })
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

async function openSampleMaterialTopic() {
  await waitFor(() => expect(screen.getByLabelText('출판사')).toBeInTheDocument())
  fireEvent.change(screen.getByLabelText('출판사'), { target: { value: 'ecrimedia' } })
  fireEvent.click(screen.getByRole('button', { name: /장소에 대해 알아볼까요/ }))
}

function addAResource() {
  fireEvent.change(screen.getByLabelText('자료 링크'), {
    target: { value: 'https://example.com/img.jpg' },
  })
  fireEvent.click(screen.getByRole('button', { name: '자료 항목 추가' }))
}

describe('MaterialsAdminPage (전체관리자로 로그인)', () => {
  it('대단원의 학습주제가 아코디언으로 전체 나열되고, 클릭하면 그 학습주제에 등록된 자료가 보인다', async () => {
    fetchAllMaterials.mockResolvedValue([sampleMaterial])
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    expect(screen.getByText(/단원 학습 내용 예상하기/)).toBeInTheDocument()
    expect(screen.queryByText('갈대밭 전경')).not.toBeInTheDocument()

    await openSampleMaterialTopic()
    expect(screen.getByText(/장소에 대해 알아볼까요/)).toBeInTheDocument()

    expect(screen.getByText('갈대밭 전경')).toBeInTheDocument()
    expect(screen.getByText('연결된 차시 1개')).toBeInTheDocument()
    expect(screen.getByText('게시됨')).toBeInTheDocument()
  })

  it('자료 목록을 불러오지 못하면 에러 메시지를 보여주고 로딩 상태를 벗어난다', async () => {
    fetchAllMaterials.mockRejectedValue(new Error('network error'))
    renderPage()

    await waitFor(() =>
      expect(screen.getByText('자료 목록을 불러오지 못했어요.')).toBeInTheDocument(),
    )
    expect(screen.queryByText('불러오는 중...')).not.toBeInTheDocument()
  })

  it('저장이 실패하면 폼이 유지되고 에러 메시지를 보여준다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    createMaterial.mockRejectedValue(new Error('write failed'))
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    addAResource()
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('저장에 실패했어요'),
    )
    expect(screen.getByText(/https:\/\/example\.com\/img\.jpg/)).toBeInTheDocument()
  })

  it('새로 만들기를 누르면 빈 폼이 보이고, 자료 항목이 없으면 저장 버튼이 비활성화된다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
    expect(screen.getByText('자료 항목을 하나 이상 추가해야 저장할 수 있어요.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← 관리자 대시보드로' })).toHaveAttribute('href', '/admin')
  })

  it('http(s)로 시작하지 않는 자료 링크는 추가되지 않고 안내 문구를 보여준다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    fireEvent.change(screen.getByLabelText('자료 링크'), {
      target: { value: 'javascript:alert(1)' },
    })
    fireEvent.click(screen.getByRole('button', { name: '자료 항목 추가' }))

    expect(screen.queryByText(/javascript:alert/)).not.toBeInTheDocument()
    expect(screen.getByText('http:// 또는 https://로 시작하는 링크만 추가할 수 있어요.')).toBeInTheDocument()
  })

  it('자료 항목을 추가하면 저장 버튼이 활성화된다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()

    addAResource()
    expect(screen.getByRole('button', { name: '저장' })).not.toBeDisabled()
    expect(
      screen.queryByText('자료 항목을 하나 이상 추가해야 저장할 수 있어요.'),
    ).not.toBeInTheDocument()
  })

  it('출판사를 바꾸면 그 출판사의 대단원/학습주제/차시로 즉시 다시 채워진다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    fireEvent.change(screen.getByLabelText('출판사'), { target: { value: 'chunjae-park' } })

    expect(screen.getByLabelText('대단원')).toHaveValue('chunjae-park-u1')
    expect(screen.getByLabelText('학습주제')).toHaveValue('chunjae-park-u1-t1')
    expect(screen.getByLabelText('차시')).toHaveValue('chunjae-park-u1-t1-l1')
    expect(screen.getByText('1. 우리가 사는 곳')).toBeInTheDocument()
    expect(screen.getByText('단원 학습 내용 예상하기')).toBeInTheDocument()
  })

  it('자료 항목과 연결 차시를 입력하고 저장하면 (전체관리자는) createMaterial이 바로 호출된다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    createMaterial.mockResolvedValue('new-id')
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    addAResource()
    expect(screen.getByText(/https:\/\/example\.com\/img\.jpg/)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('출판사'), { target: { value: 'ecrimedia' } })
    fireEvent.change(screen.getByLabelText('대단원'), { target: { value: 'ecrimedia-u1' } })
    fireEvent.change(screen.getByLabelText('학습주제'), { target: { value: 'ecrimedia-u1-t2' } })
    fireEvent.change(screen.getByLabelText('차시'), { target: { value: 'ecrimedia-u1-t2-l1' } })
    fireEvent.click(screen.getByRole('button', { name: '차시 추가' }))
    expect(screen.getByText('아이스크림미디어(한춘희) · 1. 우리가 사는 곳 · 장소에 대해 알아볼까요 · 1 / 1차시')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(createMaterial).toHaveBeenCalledWith({
        usageNote: '',
        usageFileUrl: '',
        resources: [{ type: 'photo', title: '', url: 'https://example.com/img.jpg' }],
        lessonRefs: [{ publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t2-l1' }],
      }),
    )
  })

  it('활용법 파일 링크를 입력하면 usageFileUrl로 저장된다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    createMaterial.mockResolvedValue('new-id')
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    addAResource()
    fireEvent.change(screen.getByLabelText('활용법 파일(PDF/HWP) 링크 (교사에게만 보여요)'), {
      target: { value: 'https://drive.google.com/file/d/xyz' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(createMaterial).toHaveBeenCalledWith(
        expect.objectContaining({ usageFileUrl: 'https://drive.google.com/file/d/xyz' }),
      ),
    )
  })

  it('"다른 출판사도 자동 연결" 버튼을 누르면 진도표 순서가 같은 학습주제의 차시가 다른 출판사에도 모두 연결된다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    fireEvent.change(screen.getByLabelText('출판사'), { target: { value: 'chunjae-park' } })
    fireEvent.change(screen.getByLabelText('학습주제'), { target: { value: 'chunjae-park-u1-t2' } })

    fireEvent.click(screen.getByRole('button', { name: '다른 출판사도 자동 연결' }))

    expect(
      screen.getByText('아이스크림미디어(한춘희) · 1. 우리가 사는 곳 · 장소에 대해 알아볼까요 · 1 / 1차시'),
    ).toBeInTheDocument()
  })

  it('출판사별 연결 현황에서 "학습주제 전체 보기"를 눌러 다른 학습주제를 골라 연결을 바꿀 수 있다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    fireEvent.change(screen.getByLabelText('출판사'), { target: { value: 'chunjae-park' } })
    fireEvent.click(screen.getByRole('button', { name: '다른 출판사도 자동 연결' }))
    expect(
      screen.getByText('아이스크림미디어(한춘희) · 1. 우리가 사는 곳 · 단원 도입 · 1 / 1차시'),
    ).toBeInTheDocument()

    const ecrimediaRow = screen
      .getByText('아이스크림미디어(한춘희)', { selector: '.publisher-connection-name' })
      .closest('.publisher-connection-row')
    fireEvent.click(within(ecrimediaRow).getByRole('button', { name: '학습주제 전체 보기' }))
    fireEvent.click(within(ecrimediaRow).getByRole('button', { name: '장소에 대해 알아볼까요' }))
    fireEvent.click(within(ecrimediaRow).getByRole('button', { name: '1 / 1차시 선택' }))

    expect(
      within(ecrimediaRow).getByText('아이스크림미디어(한춘희) · 1. 우리가 사는 곳 · 장소에 대해 알아볼까요 · 1 / 1차시'),
    ).toBeInTheDocument()
  })

  it('종류를 파일(PDF/HWP)로 선택하면 그 종류로 자료 항목이 추가된다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    createMaterial.mockResolvedValue('new-id')
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    fireEvent.change(screen.getByLabelText('종류'), { target: { value: 'file' } })
    fireEvent.change(screen.getByLabelText('자료 링크'), {
      target: { value: 'https://drive.google.com/file/d/abc123/view' },
    })
    fireEvent.click(screen.getByRole('button', { name: '자료 항목 추가' }))

    expect(screen.getByText(/drive\.google\.com/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(createMaterial).toHaveBeenCalledWith(
        expect.objectContaining({
          resources: [
            { type: 'file', title: '', url: 'https://drive.google.com/file/d/abc123/view' },
          ],
        }),
      ),
    )
  })

  it('수정 버튼을 누르면 기존 값이 채워진 폼이 보인다', async () => {
    fetchAllMaterials.mockResolvedValue([sampleMaterial])
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())
    await openSampleMaterialTopic()

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    expect(screen.getByLabelText('활용법 (교사에게만 보여요)')).toHaveValue('체험학습 전 사전 안내용')
    expect(screen.getByText(/갈대밭 전경/)).toBeInTheDocument()
  })

  it('수정 폼에서 저장하면 (전체관리자는) updateMaterial이 해당 id로 바로 호출된다', async () => {
    fetchAllMaterials.mockResolvedValue([sampleMaterial])
    updateMaterial.mockResolvedValue()
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())
    await openSampleMaterialTopic()

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    fireEvent.change(screen.getByLabelText('활용법 (교사에게만 보여요)'), {
      target: { value: '수정된 활용법' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(updateMaterial).toHaveBeenCalledWith(
        'm1',
        expect.objectContaining({ usageNote: '수정된 활용법' }),
      ),
    )
    expect(proposeMaterialEdit).not.toHaveBeenCalled()
  })

  it('삭제 버튼을 누르면 deleteMaterial이 호출되고 목록에서 사라진다', async () => {
    fetchAllMaterials.mockResolvedValueOnce([sampleMaterial]).mockResolvedValueOnce([])
    deleteMaterial.mockResolvedValue()
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())
    await openSampleMaterialTopic()
    expect(screen.getByText('갈대밭 전경')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(deleteMaterial).toHaveBeenCalledWith('m1'))
    await waitFor(() => expect(screen.queryByText('갈대밭 전경')).not.toBeInTheDocument())
  })

  it('삭제 확인 창에서 취소하면 deleteMaterial이 호출되지 않는다', async () => {
    window.confirm.mockReturnValue(false)
    fetchAllMaterials.mockResolvedValue([sampleMaterial])
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())
    await openSampleMaterialTopic()
    expect(screen.getByText('갈대밭 전경')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))

    expect(deleteMaterial).not.toHaveBeenCalled()
    expect(screen.getByText('갈대밭 전경')).toBeInTheDocument()
  })

  it('수정 폼에서 저장하면 lessonIds/id 필드가 제외된 객체로 updateMaterial이 호출된다', async () => {
    fetchAllMaterials.mockResolvedValue([{ ...sampleMaterial, lessonIds: ['stale-lesson-id'] }])
    updateMaterial.mockResolvedValue()
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())
    await openSampleMaterialTopic()

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(updateMaterial).toHaveBeenCalled())
    const calledArg = updateMaterial.mock.calls[0][1]
    expect('lessonIds' in calledArg).toBe(false)
    expect('id' in calledArg).toBe(false)
    expect('status' in calledArg).toBe(false)
    expect('submittedBy' in calledArg).toBe(false)
    expect('pendingChanges' in calledArg).toBe(false)
  })
})

describe('MaterialsAdminPage (학교관리자로 로그인)', () => {
  beforeEach(() => {
    saveAdminSession({
      role: 'school-admin',
      schoolId: 'songlim-cho',
      schoolName: '송림초',
      teacherName: '김선생',
    })
  })

  it('새로 만들기로 저장하면 status:pending, submittedBy가 담겨 createMaterial이 호출되고 검토 요청 안내가 보인다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    createMaterial.mockResolvedValue('new-id')
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    expect(screen.getByText(/전체 관리자가 확인한 뒤에/)).toBeInTheDocument()
    addAResource()
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(createMaterial).toHaveBeenCalledWith(
        expect.objectContaining({ resources: expect.any(Array) }),
        {
          status: 'pending',
          submittedBy: { schoolId: 'songlim-cho', schoolName: '송림초', teacherName: '김선생' },
        },
      ),
    )
    await waitFor(() => expect(screen.getByText(/검토 요청을 보냈어요/)).toBeInTheDocument())
  })

  it('이미 게시된 자료를 수정하면 updateMaterial 대신 proposeMaterialEdit이 호출되고 반영 전 안내가 보인다', async () => {
    fetchAllMaterials.mockResolvedValue([sampleMaterial])
    proposeMaterialEdit.mockResolvedValue()
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())
    await openSampleMaterialTopic()

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    expect(screen.getByText(/전체 관리자가 확인한 뒤에/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('활용법 (교사에게만 보여요)'), {
      target: { value: '학교관리자가 제안한 내용' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(proposeMaterialEdit).toHaveBeenCalledWith(
        'm1',
        expect.objectContaining({ usageNote: '학교관리자가 제안한 내용' }),
        { schoolId: 'songlim-cho', schoolName: '송림초', teacherName: '김선생' },
      ),
    )
    expect(updateMaterial).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByText(/수정 요청을 보냈어요/)).toBeInTheDocument())
  })

  it('아직 검토 대기 중인(자신의) 자료를 수정하면 updateMaterial이 바로 호출된다', async () => {
    const pendingMaterial = {
      ...sampleMaterial,
      status: 'pending',
      submittedBy: { schoolId: 'songlim-cho', schoolName: '송림초', teacherName: '김선생' },
    }
    fetchAllMaterials.mockResolvedValue([pendingMaterial])
    updateMaterial.mockResolvedValue()
    renderPage()
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())
    await openSampleMaterialTopic()

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    expect(screen.queryByText(/전체 관리자가 확인한 뒤에/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(updateMaterial).toHaveBeenCalledWith('m1', expect.anything()))
    expect(proposeMaterialEdit).not.toHaveBeenCalled()
  })
})
