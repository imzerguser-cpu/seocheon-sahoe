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

export function getYoutubeEmbedUrl(url) {
  if (!isSafeUrl(url)) return null
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  const host = parsed.hostname.replace(/^www\.|^m\./, '')

  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1)
    return id ? `https://www.youtube.com/embed/${id}` : null
  }
  if (host === 'youtube.com') {
    if (parsed.pathname === '/watch') {
      const id = parsed.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (parsed.pathname.startsWith('/shorts/')) {
      const id = parsed.pathname.split('/')[2]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (parsed.pathname.startsWith('/embed/')) {
      return url
    }
  }
  return null
}

export default function ResourceCard({ resource }) {
  const label = TYPE_LABELS[resource.type] ?? resource.type
  const safeUrl = isSafeUrl(resource.url)
  const youtubeEmbedUrl = resource.type === 'video' ? getYoutubeEmbedUrl(resource.url) : null

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
      {youtubeEmbedUrl && (
        <iframe
          className="video-embed"
          src={youtubeEmbedUrl}
          title={resource.title || '자료 영상'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
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
