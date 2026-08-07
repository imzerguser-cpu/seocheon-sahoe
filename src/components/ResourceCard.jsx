import { QRCodeSVG } from 'qrcode.react'

const TYPE_LABELS = {
  photo: '🖼️ 사진',
  video: '🎬 영상',
  qr: '📱 QR 코드',
}

export default function ResourceCard({ resource }) {
  const label = TYPE_LABELS[resource.type] ?? resource.type

  return (
    <div className="resource-card">
      <span className="resource-type">{label}</span>
      <p className="resource-title">{resource.title || '제목 미정'}</p>
      {resource.type === 'photo' && resource.url && (
        <img src={resource.url} alt={resource.title || '자료 사진'} />
      )}
      {resource.type === 'qr' && resource.url && (
        <QRCodeSVG value={resource.url} size={128} role="img" aria-label="QR 코드" />
      )}
      {resource.url ? (
        <a href={resource.url} target="_blank" rel="noreferrer">
          자료 열기
        </a>
      ) : (
        <p className="resource-pending">링크 준비 중</p>
      )}
    </div>
  )
}
