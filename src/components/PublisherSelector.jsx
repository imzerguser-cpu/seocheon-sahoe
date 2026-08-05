export default function PublisherSelector({ publishers, onSelect }) {
  return (
    <div className="publisher-grid" role="list">
      {publishers.map((publisher) => (
        <button
          key={publisher.id}
          role="listitem"
          type="button"
          className="publisher-card"
          onClick={() => onSelect(publisher.id)}
        >
          {publisher.name}
        </button>
      ))}
    </div>
  )
}
