import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MaterialsAdminPage from './MaterialsAdminPage.jsx'

vi.mock('../lib/materialsRepo.js', () => ({
  fetchAllMaterials: vi.fn(),
  createMaterial: vi.fn(),
  updateMaterial: vi.fn(),
  deleteMaterial: vi.fn(),
}))

import {
  fetchAllMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from '../lib/materialsRepo.js'

const sampleMaterial = {
  id: 'm1',
  title: '장항 신성리 갈대밭',
  usageNote: '체험학습 전 사전 안내용',
  resources: [{ type: 'photo', title: '갈대밭 전경', url: 'https://example.com/photo.jpg' }],
  lessonRefs: [{ publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t2-l1' }],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MaterialsAdminPage', () => {
  it('자료 목록에 제목과 연결된 차시 개수를 보여준다', async () => {
    fetchAllMaterials.mockResolvedValue([sampleMaterial])
    render(<MaterialsAdminPage />)

    await waitFor(() => expect(screen.getByText('장항 신성리 갈대밭')).toBeInTheDocument())
    expect(screen.getByText('연결된 차시 1개')).toBeInTheDocument()
  })

  it('자료 목록을 불러오지 못하면 에러 메시지를 보여주고 로딩 상태를 벗어난다', async () => {
    fetchAllMaterials.mockRejectedValue(new Error('network error'))
    render(<MaterialsAdminPage />)

    await waitFor(() =>
      expect(screen.getByText('자료 목록을 불러오지 못했어요.')).toBeInTheDocument(),
    )
    expect(screen.queryByText('불러오는 중...')).not.toBeInTheDocument()
  })

  it('저장이 실패하면 폼이 유지되고 에러 메시지를 보여준다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    createMaterial.mockRejectedValue(new Error('write failed'))
    render(<MaterialsAdminPage />)
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '새 자료' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('저장에 실패했어요'),
    )
    expect(screen.getByLabelText('제목')).toHaveValue('새 자료')
  })

  it('새로 만들기를 누르면 빈 폼이 보인다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    render(<MaterialsAdminPage />)
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    expect(screen.getByLabelText('제목')).toHaveValue('')
  })

  it('http(s)로 시작하지 않는 자료 링크는 추가되지 않고 안내 문구를 보여준다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    render(<MaterialsAdminPage />)
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    fireEvent.change(screen.getByLabelText('자료 링크'), {
      target: { value: 'javascript:alert(1)' },
    })
    fireEvent.click(screen.getByRole('button', { name: '자료 항목 추가' }))

    expect(screen.queryByText(/javascript:alert/)).not.toBeInTheDocument()
    expect(screen.getByText('http:// 또는 https://로 시작하는 링크만 추가할 수 있어요.')).toBeInTheDocument()
  })

  it('제목이 비어있으면 저장 버튼이 비활성화되고, 입력하면 활성화된다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    render(<MaterialsAdminPage />)
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '새 자료' } })
    expect(screen.getByRole('button', { name: '저장' })).not.toBeDisabled()
  })

  it('제목, 자료 항목, 연결 차시를 입력하고 저장하면 createMaterial이 호출된다', async () => {
    fetchAllMaterials.mockResolvedValue([])
    createMaterial.mockResolvedValue('new-id')
    render(<MaterialsAdminPage />)
    await waitFor(() => expect(fetchAllMaterials).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '새로 만들기' }))
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '새 자료' } })

    fireEvent.change(screen.getByLabelText('자료 링크'), {
      target: { value: 'https://example.com/img.jpg' },
    })
    fireEvent.click(screen.getByRole('button', { name: '자료 항목 추가' }))
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
        title: '새 자료',
        usageNote: '',
        resources: [{ type: 'photo', title: '', url: 'https://example.com/img.jpg' }],
        lessonRefs: [{ publisherId: 'ecrimedia', lessonId: 'ecrimedia-u1-t2-l1' }],
      }),
    )
  })

  it('수정 버튼을 누르면 기존 값이 채워진 폼이 보인다', async () => {
    fetchAllMaterials.mockResolvedValue([sampleMaterial])
    render(<MaterialsAdminPage />)
    await waitFor(() => expect(screen.getByText('장항 신성리 갈대밭')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    expect(screen.getByLabelText('제목')).toHaveValue('장항 신성리 갈대밭')
  })

  it('수정 폼에서 저장하면 updateMaterial이 해당 id로 호출된다', async () => {
    fetchAllMaterials.mockResolvedValue([sampleMaterial])
    updateMaterial.mockResolvedValue()
    render(<MaterialsAdminPage />)
    await waitFor(() => expect(screen.getByText('장항 신성리 갈대밭')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '수정된 제목' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(updateMaterial).toHaveBeenCalledWith(
        'm1',
        expect.objectContaining({ title: '수정된 제목' }),
      ),
    )
  })

  it('삭제 버튼을 누르면 deleteMaterial이 호출되고 목록에서 사라진다', async () => {
    fetchAllMaterials.mockResolvedValueOnce([sampleMaterial]).mockResolvedValueOnce([])
    deleteMaterial.mockResolvedValue()
    render(<MaterialsAdminPage />)
    await waitFor(() => expect(screen.getByText('장항 신성리 갈대밭')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(deleteMaterial).toHaveBeenCalledWith('m1'))
    await waitFor(() => expect(screen.queryByText('장항 신성리 갈대밭')).not.toBeInTheDocument())
  })

  it('수정 폼에서 저장하면 id 필드가 제외된 객체로 updateMaterial이 호출된다', async () => {
    fetchAllMaterials.mockResolvedValue([sampleMaterial])
    updateMaterial.mockResolvedValue()
    render(<MaterialsAdminPage />)
    await waitFor(() => expect(screen.getByText('장항 신성리 갈대밭')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(updateMaterial).toHaveBeenCalled())
    expect(updateMaterial).toHaveBeenCalledWith(
      'm1',
      expect.not.objectContaining({ id: expect.anything() }),
    )
    const calledArg = updateMaterial.mock.calls[0][1]
    expect('id' in calledArg).toBe(false)
  })
})
