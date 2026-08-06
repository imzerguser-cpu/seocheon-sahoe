import { Link } from 'react-router-dom'

export default function EntityCardList({ items, getHref, emptyMessage }) {
  if (items.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>
  }
  return (
    <ul className="entity-card-list">
      {items.map((item) => (
        <li key={item.id}>
          <Link to={getHref(item)} className="entity-card">
            {item.title}
          </Link>
        </li>
      ))}
    </ul>
  )
}
