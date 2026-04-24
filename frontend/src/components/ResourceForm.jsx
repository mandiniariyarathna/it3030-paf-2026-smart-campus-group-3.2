import { useMemo, useState } from 'react';

const emptyForm = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: 1,
  location: '',
  status: 'ACTIVE',
  description: '',
};

function ResourceForm({ mode = 'create', initialData, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState(() => ({
    ...emptyForm,
    ...(initialData || {}),
  }));
  const [error, setError] = useState('');

  const title = useMemo(() => (mode === 'edit' ? 'Edit Resource' : 'Add New Resource'), [mode]);

  const handleChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.location.trim()) {
      setError('Name and location are required.');
      return;
    }

    if (Number(formData.capacity) < 1) {
      setError('Capacity must be at least 1.');
      return;
    }

    await onSubmit({
      ...formData,
      name: formData.name.trim(),
      location: formData.location.trim(),
      description: formData.description?.trim() || '',
      capacity: Number(formData.capacity),
    });
  };

  return (
    <section className="resource-form-panel" aria-label={title}>
      <div className="resource-form-head">
        <div>
          <h2>{title}</h2>
          <p>
            Fill in the details below so students and staff can quickly understand where the resource is and how it
            can be used.
          </p>
        </div>
      </div>

      <form className="resource-form" onSubmit={handleSubmit}>
        <div className="resource-form-grid">
          <div className="resource-field">
            <label htmlFor="resource-name">Name</label>
            <input
              id="resource-name"
              type="text"
              value={formData.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="e.g. Lecture Hall A"
              maxLength={100}
              required
            />
          </div>

          <div className="resource-field">
            <label htmlFor="resource-type">Type</label>
            <select
              id="resource-type"
              value={formData.type}
              onChange={(event) => handleChange('type', event.target.value)}
            >
              <option value="LECTURE_HALL">Lecture Hall</option>
              <option value="LAB">Lab</option>
              <option value="MEETING_ROOM">Meeting Room</option>
              <option value="EQUIPMENT">Equipment</option>
            </select>
          </div>

          <div className="resource-field">
            <label htmlFor="resource-capacity">Capacity</label>
            <input
              id="resource-capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(event) => handleChange('capacity', event.target.value)}
              required
            />
          </div>

          <div className="resource-field">
            <label htmlFor="resource-location">Location</label>
            <input
              id="resource-location"
              type="text"
              maxLength={200}
              value={formData.location}
              onChange={(event) => handleChange('location', event.target.value)}
              placeholder="e.g. Block A, Floor 2"
              required
            />
          </div>

          <div className="resource-field">
            <label htmlFor="resource-status">Status</label>
            <select
              id="resource-status"
              value={formData.status}
              onChange={(event) => handleChange('status', event.target.value)}
            >
              <option value="ACTIVE">Active</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>
          </div>

          <div className="resource-field resource-field-full">
            <label htmlFor="resource-description">Description</label>
            <textarea
              id="resource-description"
              maxLength={500}
              rows={4}
              value={formData.description}
              onChange={(event) => handleChange('description', event.target.value)}
              placeholder="Add a short note about facilities, equipment, or access restrictions."
            />
          </div>
        </div>

        {error ? <p className="field-error">{error}</p> : null}

        <div className="resource-form-actions">
          <button type="button" className="ghost-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Resource' : 'Create Resource'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ResourceForm;
