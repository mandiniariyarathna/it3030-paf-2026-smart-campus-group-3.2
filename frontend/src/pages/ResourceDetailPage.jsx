import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getResourceAvailability, getResourceById } from '../services/resourceService';

function getSessionRole() {
  try {
    const session = JSON.parse(window.localStorage.getItem('smart-campus-session') || 'null');
    return (session?.role || '').toUpperCase();
  } catch {
    return '';
  }
}

function ResourceDetailPage() {
  const { id } = useParams();
  const isAdmin = getSessionRole() === 'ADMIN';
  const [resource, setResource] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadResource = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [resourceData, availabilityData] = await Promise.all([
          getResourceById(id),
          getResourceAvailability(id),
        ]);

        setResource(resourceData);
        setAvailability(availabilityData);
      } catch (loadError) {
        setError(loadError.message || 'Failed to load resource details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadResource();
  }, [id]);

  if (isLoading) {
    return <main className="resource-page">Loading resource...</main>;
  }

  if (error) {
    return (
      <main className="resource-page">
        <p className="field-error">{error}</p>
        <Link to="/resources" className="resource-link">
          Back to Resources
        </Link>
      </main>
    );
  }

  if (!resource) {
    return <main className="resource-page">Resource not found.</main>;
  }

  return (
    <main className="resource-page">
      <header className="resource-page-head">
        <div>
          <p className="home-kicker">Resource Details</p>
          <h1>{resource.name}</h1>
          <p className="resource-meta">{resource.location}</p>
        </div>
      </header>

      <section className="resource-overview resource-overview-detail" aria-label="resource snapshot">
        <article className="resource-stat-card">
          <p>Type</p>
          <strong>{resource.type}</strong>
        </article>
        <article className="resource-stat-card">
          <p>Status</p>
          <strong>{resource.status}</strong>
        </article>
        <article className="resource-stat-card">
          <p>Capacity</p>
          <strong>{resource.capacity}</strong>
        </article>
        <article className="resource-stat-card">
          <p>Availability windows</p>
          <strong>{availability.length}</strong>
        </article>
      </section>

      <section className="resource-detail-card">
        <h2>About this resource</h2>
        <p>{resource.description || 'No description provided.'}</p>
      </section>

      <section className="resource-detail-card">
        <h2>Availability Calendar</h2>
        {availability.length === 0 ? (
          <p>This resource currently has no configured availability windows.</p>
        ) : (
          <ul className="availability-list">
            {availability.map((window, index) => (
              <li key={`${window.dayOfWeek}-${window.startTime}-${index}`}>
                <strong>{window.dayOfWeek}</strong>: {window.startTime} - {window.endTime}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="resource-detail-actions">
        {!isAdmin ? (
          <Link to={`/bookings/new?resourceId=${resource.id}`} className="primary-btn link-btn book-now-btn">
            Book Now
          </Link>
        ) : null}
        <Link to="/resources" className="resource-link ghost-btn">
          Back to Resources
        </Link>
      </section>

    </main>
  );
}

export default ResourceDetailPage;
