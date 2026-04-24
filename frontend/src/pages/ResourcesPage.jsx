import { useEffect, useMemo, useState } from 'react';

import ResourceCard from '../components/ResourceCard';
import ResourceFilter from '../components/ResourceFilter';
import ResourceForm from '../components/ResourceForm';
import { createResource, getResources, updateResource } from '../services/resourceService';

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

  const isAdmin = (localStorage.getItem('userRole') || 'ADMIN').toUpperCase() === 'ADMIN';

  const queryFilters = useMemo(
    () => ({
      ...filters,
      capacity: filters.capacity ? Number(filters.capacity) : undefined,
    }),
    [filters]
  );

  useEffect(() => {
    const loadResources = async () => {
      const data = await getResources(queryFilters);
      setResources(data);
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
      if (editingResource) {
        await updateResource(editingResource.id, payload);
      } else {
        await createResource(payload);
      }

      await refreshResources();
      closeForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="resource-page">
      <header className="resource-page-head">
        <p className="home-kicker">Facilities & Assets Catalogue</p>
        <h1>Campus Resources</h1>
        {isAdmin ? (
          <button type="button" className="primary-btn" onClick={openCreateForm}>
            Add Resource
          </button>
        ) : null}
      </header>

      <section className="resource-layout">
        <ResourceFilter filters={filters} onChange={handleFilterChange} onReset={resetFilters} />

        <section className="resource-grid" aria-label="resources">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} isAdmin={isAdmin} onEdit={openEditForm} />
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
