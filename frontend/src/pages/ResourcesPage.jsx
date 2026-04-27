import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import ResourceCard from '../components/ResourceCard';
import ResourceFilter from '../components/ResourceFilter';
import ResourceForm from '../components/ResourceForm';
import { createResource, getResources, softDeleteResource, updateResource } from '../services/resourceService';

const defaultFilters = {
  type: '',
  status: '',
  location: '',
  capacity: '',
};

const defaultSort = 'recentlyAdded';

const statusSortOrder = {
  ACTIVE: 0,
  UNDER_MAINTENANCE: 1,
  OUT_OF_SERVICE: 2,
};

function getSessionRole() {
  try {
    const session = JSON.parse(window.localStorage.getItem('smart-campus-session') || 'null');
    return (session?.role || '').toUpperCase();
  } catch {
    return '';
  }
}

function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [sortBy, setSortBy] = useState(defaultSort);
  const [formOpen, setFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = getSessionRole() === 'ADMIN';

  const queryFilters = useMemo(
    () => ({
      ...filters,
      capacity: filters.capacity ? Number(filters.capacity) : undefined,
    }),
    [filters]
  );

  const resourceStats = useMemo(() => {
    const total = resources.length;
    const active = resources.filter((resource) => resource.status === 'ACTIVE').length;
    const maintenance = resources.filter((resource) => resource.status === 'UNDER_MAINTENANCE').length;

    return [
      { label: 'Total resources', value: total },
      { label: 'Active now', value: active },
      { label: 'Under maintenance', value: maintenance },
    ];
  }, [resources]);

  const sortedResources = useMemo(() => {
    const parseCreatedAt = (value) => {
      const parsed = new Date(value || 0);
      return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    };

    return [...resources].sort((left, right) => {
      if (sortBy === 'capacity') {
        return left.capacity - right.capacity;
      }

      if (sortBy === 'name') {
        return left.name.localeCompare(right.name);
      }

      if (sortBy === 'status') {
        const leftRank = statusSortOrder[left.status] ?? Number.MAX_SAFE_INTEGER;
        const rightRank = statusSortOrder[right.status] ?? Number.MAX_SAFE_INTEGER;

        if (leftRank !== rightRank) {
          return leftRank - rightRank;
        }

        return left.name.localeCompare(right.name);
      }

      return parseCreatedAt(right.createdAt) - parseCreatedAt(left.createdAt);
    });
  }, [resources, sortBy]);

  useEffect(() => {
    const loadResources = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await getResources(queryFilters);
        setResources(data);
      } catch (loadError) {
        setError(loadError.message || 'Failed to load resources.');
      } finally {
        setIsLoading(false);
      }
    };

    loadResources();
  }, [queryFilters]);

  const handleFilterChange = (field, value) => {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSortBy(defaultSort);
  };

  const refreshResources = async () => {
    const data = await getResources(queryFilters);
    setResources(data);
  };

  const openCreateForm = () => {
    setEditingResource(null);
    setFormOpen(true);
  };

  const openEditForm = (resource) => {
    setEditingResource(resource);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingResource(null);
  };

  useEffect(() => {
    if (!formOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeForm();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => window.removeEventListener('keydown', handleEscape);
  }, [formOpen]);

  const handleSubmitForm = async (payload) => {
    setIsSubmitting(true);

    try {
      setError('');

      if (editingResource) {
        await updateResource(editingResource.id, payload);
      } else {
        await createResource(payload);
      }

      await refreshResources();
      closeForm();
    } catch (submitError) {
      setError(submitError.message || 'Failed to save resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResource = async (resource) => {
    const confirmed = window.confirm(
      `Delete ${resource.name}? This will set the resource status to OUT_OF_SERVICE.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      await softDeleteResource(resource.id);
      await refreshResources();
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete resource.');
    }
  };

  return (
    <main className="resource-page">
      <header className="resource-page-head">
        <div>
          <p className="home-kicker">Facilities & Assets Catalogue</p>
          <h1>Campus Resources</h1>
          <p className="resource-page-copy">
            Browse halls, labs, meeting rooms, and equipment in one place. Use filters to narrow the list before
            booking or updating a resource.
          </p>
        </div>
        <div className="resource-page-actions">
          {isAdmin ? (
            <Link to="/admin" className="resource-link ghost-btn">
              Back to Admin Dashboard
            </Link>
          ) : (
            <Link to="/home" className="resource-link ghost-btn">
              Back to User Dashboard
            </Link>
          )}
          {isAdmin ? (
            <button type="button" className="primary-btn" onClick={openCreateForm}>
              Add Resource
            </button>
          ) : null}
        </div>
      </header>

      <section className="resource-overview" aria-label="resource summary">
        {resourceStats.map((stat) => (
          <article key={stat.label} className="resource-stat-card">
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="resource-status-legend" aria-label="resource status legend">
        <span className="resource-status-legend-label">Status legend</span>
        <div className="resource-status-legend-items">
          <span className="resource-status-legend-item">
            <span className="resource-status resource-status-dot status-active" aria-hidden="true">
              🟢
            </span>
            <span>Active</span>
          </span>
          <span className="resource-status-legend-item">
            <span className="resource-status resource-status-dot status-maintenance" aria-hidden="true">
              🟡
            </span>
            <span>Under Maintenance</span>
          </span>
          <span className="resource-status-legend-item">
            <span className="resource-status resource-status-dot status-out" aria-hidden="true">
              🔴
            </span>
            <span>Out of Service</span>
          </span>
        </div>
      </section>

      <section className="resource-layout">
        <ResourceFilter
          filters={filters}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onChange={handleFilterChange}
          onReset={resetFilters}
        />

        <section className="resource-grid" aria-label="resources">
          {isLoading ? <p className="resource-feedback">Loading resources...</p> : null}
          {!isLoading && error ? <p className="resource-feedback field-error">{error}</p> : null}
          {!isLoading && !error && resources.length === 0 ? (
            <p className="resource-feedback">No resources match the current filters.</p>
          ) : null}
          {sortedResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isAdmin={isAdmin}
              onEdit={openEditForm}
              onDelete={handleDeleteResource}
            />
          ))}
        </section>
      </section>

      {formOpen && isAdmin ? (
        <div className="resource-modal" role="presentation" onClick={closeForm}>
          <div
            className="resource-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={editingResource ? 'Edit resource' : 'Create resource'}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="resource-modal-close" onClick={closeForm} aria-label="Close dialog">
              ×
            </button>
            <ResourceForm
              mode={editingResource ? 'edit' : 'create'}
              initialData={editingResource}
              onSubmit={handleSubmitForm}
              onCancel={closeForm}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default ResourcesPage;
