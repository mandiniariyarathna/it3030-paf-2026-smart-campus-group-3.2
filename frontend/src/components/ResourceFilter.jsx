function ResourceFilter({ filters, onChange, onReset }) {
  return (
    <aside className="resource-filter">
      <h2>Filter Resources</h2>
      <p className="resource-filter-copy">Use one or more filters to quickly find the right space or equipment.</p>

      <label htmlFor="filter-type">Type</label>
      <select id="filter-type" value={filters.type} onChange={(event) => onChange('type', event.target.value)}>
        <option value="">All types</option>
        <option value="LECTURE_HALL">Lecture Hall</option>
        <option value="LAB">Lab</option>
        <option value="MEETING_ROOM">Meeting Room</option>
        <option value="EQUIPMENT">Equipment</option>
      </select>

      <label htmlFor="filter-status">Status</label>
      <select
        id="filter-status"
        value={filters.status}
        onChange={(event) => onChange('status', event.target.value)}
      >
        <option value="">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="UNDER_MAINTENANCE">Under maintenance</option>
        <option value="OUT_OF_SERVICE">Out of service</option>
      </select>

      <label htmlFor="filter-location">Location</label>
      <input
        id="filter-location"
        type="text"
        placeholder="Search by location"
        value={filters.location}
        onChange={(event) => onChange('location', event.target.value)}
      />

      <label htmlFor="filter-capacity">Minimum Capacity</label>
      <input
        id="filter-capacity"
        type="number"
        min="1"
        placeholder="e.g. 30"
        value={filters.capacity}
        onChange={(event) => onChange('capacity', event.target.value)}
      />

      <button type="button" className="filter-reset" onClick={onReset}>
        Clear Filters
      </button>
    </aside>
  );
}

export default ResourceFilter;
