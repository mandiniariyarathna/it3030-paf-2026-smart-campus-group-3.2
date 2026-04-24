import { Link } from 'react-router-dom';

const typeIconMap = {
  LECTURE_HALL: '🎓',
  LAB: '🧪',
  MEETING_ROOM: '🧩',
  EQUIPMENT: '🛠️',
};

const statusClassMap = {
  ACTIVE: 'status-active',
  OUT_OF_SERVICE: 'status-out',
  UNDER_MAINTENANCE: 'status-maintenance',
};

function ResourceCard({ resource, isAdmin, onEdit }) {
  const icon = typeIconMap[resource.type] || '🏫';
  const statusClass = statusClassMap[resource.status] || 'status-neutral';

  return (
    <article className="resource-card">
      <div className="resource-card-head">
        <div className="resource-card-type">
          <span className="resource-icon" aria-hidden="true">
            {icon}
          </span>
          <span>{resource.type.replaceAll('_', ' ')}</span>
        </div>
        <span className={`resource-status ${statusClass}`}>{resource.status}</span>
      </div>

      <h3>{resource.name}</h3>
      <p className="resource-meta">{resource.location}</p>

      <div className="resource-card-facts">
        <span>Capacity</span>
        <strong>{resource.capacity}</strong>
      </div>

      <div className="resource-actions">
        <Link to={`/resources/${resource.id}`} className="resource-link">
          View Details
        </Link>
        {isAdmin ? (
          <button type="button" className="resource-link ghost-btn" onClick={() => onEdit(resource)}>
            Edit
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default ResourceCard;
