const TYPE_LABELS = {
  image: '🖼️ 이미지',
  pdf: '📄 PDF',
  video: '🎬 영상',
  qr: '📱 QR 링크',
}

export default function ResourceCard({ resource }) {
  const label = TYPE_LABELS[resource.type] ?? resource.type

  return (
    <div className="resource-card">
      <span className="resource-type">{label}</span>
      <p className="resource-title">{resource.title || '제목 미정'}</p>
      {resource.type === 'image' && resource.src && (
        <img src={resource.src} alt={resource.title || '자료 이미지'} />
      )}
      {resource.url && (
        <a href={resource.url} target="_blank" rel="noreferrer">
          자료 열기
        </a>
      )}
      {!resource.url && resource.type !== 'image' && <p className="resource-pending">링크 준비 중</p>}
    </div>
  )
}
