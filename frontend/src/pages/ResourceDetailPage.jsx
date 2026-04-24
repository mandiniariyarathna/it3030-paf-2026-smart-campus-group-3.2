import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getResourceAvailability, getResourceById } from '../services/resourceService';

function ResourceDetailPage() {
  const { id } = useParams();
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
        <p className="home-kicker">Resource Details</p>
        <h1>{resource.name}</h1>
        <p className="resource-meta">{resource.location}</p>
      </header>

      <section className="resource-detail-card">
        <p>
          <strong>Type:</strong> {resource.type}
        </p>
        <p>
          <strong>Status:</strong> {resource.status}
        </p>
        <p>
          <strong>Capacity:</strong> {resource.capacity}
        </p>
        <p>
          <strong>Description:</strong> {resource.description || 'No description provided.'}
        </p>
      </section>

      <section className="resource-detail-card">
        <h2>Availability Calendar</h2>
        {availability.length === 0 ? (
          <p>No availability windows configured.</p>
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

      <Link to="/resources" className="resource-link">
        Back to Resources
      </Link>
    </main>
  );
}

export default ResourceDetailPage;
