import { useEffect, useMemo, useState } from 'react';

import ResourceCard from '../components/ResourceCard';
import ResourceFilter from '../components/ResourceFilter';
import { getResources } from '../services/resourceService';

const defaultFilters = {
  type: '',
  status: '',
  location: '',
  capacity: '',
};

function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);

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

  return (
    <main className="resource-page">
      <header className="resource-page-head">
        <p className="home-kicker">Facilities & Assets Catalogue</p>
        <h1>Campus Resources</h1>
      </header>

      <section className="resource-layout">
        <ResourceFilter filters={filters} onChange={handleFilterChange} onReset={resetFilters} />

        <section className="resource-grid" aria-label="resources">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} isAdmin={false} onEdit={() => {}} />
          ))}
        </section>
      </section>
    </main>
  );
}

export default ResourcesPage;
