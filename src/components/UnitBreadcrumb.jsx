import { Link } from 'react-router-dom'

export default function UnitBreadcrumb({ trail = [], current }) {
  return (
    <nav className="breadcrumb" aria-label="이동 경로">
      <Link to="/">출판사 선택</Link>
      {trail.map((item) => (
        <span key={item.href}>
          <span className="breadcrumb-sep">›</span>
          <Link to={item.href}>{item.label}</Link>
        </span>
      ))}
      {current && (
        <span>
          <span className="breadcrumb-sep">›</span>
          <span>{current}</span>
        </span>
      )}
    </nav>
  )
}
