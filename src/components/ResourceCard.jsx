import { QRCodeSVG } from 'qrcode.react'

const TYPE_LABELS = {
  photo: '🖼️ 사진',
  video: '🎬 영상',
  qr: '📱 QR 코드',
  file: '📄 파일(PDF/HWP)',
}

export function isSafeUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url)
}

export default function ResourceCard({ resource }) {
  const label = TYPE_LABELS[resource.type] ?? resource.type
  const safeUrl = isSafeUrl(resource.url)

  return (
    <div className="resource-card">
      <span className="resource-type">{label}</span>
      <p className="resource-title">{resource.title || '제목 미정'}</p>
      {resource.type === 'photo' && safeUrl && (
        <img src={resource.url} alt={resource.title || '자료 사진'} />
      )}
      {resource.type === 'qr' && safeUrl && (
        <QRCodeSVG value={resource.url} size={128} role="img" aria-label="QR 코드" />
      )}
      {safeUrl ? (
        <a href={resource.url} target="_blank" rel="noreferrer">
          자료 열기
        </a>
      ) : (
        <p className="resource-pending">링크 준비 중</p>
      )}
    </div>
  )
}
