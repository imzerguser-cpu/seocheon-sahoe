import { useNavigate } from 'react-router-dom'
import { getPublishers } from '../lib/dataLoader.js'
import { saveSelectedPublisher, getSelectedPublisher } from '../lib/publisherPreference.js'
import PublisherSelector from '../components/PublisherSelector.jsx'
import SeocheonMapBackground from '../components/SeocheonMapBackground.jsx'

export default function PublisherSelectPage() {
  const navigate = useNavigate()
  const publishers = getPublishers()
  const lastPublisherId = getSelectedPublisher()
  const lastPublisher = publishers.find((p) => p.id === lastPublisherId)

  function handleSelect(publisherId) {
    saveSelectedPublisher(publisherId)
    navigate(`/p/${publisherId}`)
  }

  return (
    <main className="publisher-select-page">
      <SeocheonMapBackground />
      <div className="publisher-select-content">
        <h1>어떤 사회 교과서를 쓰고 있나요?</h1>
        {lastPublisher && (
          <button type="button" className="resume-button" onClick={() => handleSelect(lastPublisher.id)}>
            이어서 보기: {lastPublisher.name}
          </button>
        )}
        <PublisherSelector publishers={publishers} onSelect={handleSelect} />
      </div>
    </main>
  )
}
