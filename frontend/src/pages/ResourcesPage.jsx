import { useEffect, useMemo, useState } from 'react';

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

function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [formOpen, setFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = (localStorage.getItem('userRole') || 'ADMIN').toUpperCase() === 'ADMIN';

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
        {isAdmin ? (
          <button type="button" className="primary-btn" onClick={openCreateForm}>
            Add Resource
          </button>
        ) : null}
      </header>

      <section className="resource-overview" aria-label="resource summary">
        {resourceStats.map((stat) => (
          <article key={stat.label} className="resource-stat-card">
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="resource-layout">
        <ResourceFilter filters={filters} onChange={handleFilterChange} onReset={resetFilters} />

        <section className="resource-grid" aria-label="resources">
          {isLoading ? <p className="resource-feedback">Loading resources...</p> : null}
          {!isLoading && error ? <p className="resource-feedback field-error">{error}</p> : null}
          {!isLoading && !error && resources.length === 0 ? (
            <p className="resource-feedback">No resources match the current filters.</p>
          ) : null}
          {resources.map((resource) => (
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
        <ResourceForm
          mode={editingResource ? 'edit' : 'create'}
          initialData={editingResource}
          onSubmit={handleSubmitForm}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </main>
  );
}

export default ResourcesPage;
