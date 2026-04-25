import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import ImageUploadPreview from '../components/ImageUploadPreview';
import { createTicket } from '../services/ticketService';

const defaultForm = {
  resourceId: '',
  location: '',
  category: 'OTHER',
  description: '',
  priority: 'MEDIUM',
  contactDetails: '',
};

function CreateTicketPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(defaultForm);
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        location: formData.location.trim(),
        description: formData.description.trim(),
        contactDetails: formData.contactDetails.trim(),
        resourceId: formData.resourceId.trim() || null,
      };

      const created = await createTicket(payload, files);
      navigate(`/tickets/${created.id}`);
    } catch (submitError) {
      setError(submitError.message || 'Failed to create ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="ticket-page">
      <header className="ticket-page-head">
        <div>
          <p className="home-kicker">Maintenance & Incident Ticketing</p>
          <h1>Create a New Ticket</h1>
          <p>Report issues quickly with clear details and optional photo evidence.</p>
        </div>
        <Link to="/tickets/my" className="ghost-btn ticket-link-btn">
          View My Tickets
        </Link>
      </header>

      <form className="ticket-form" onSubmit={handleSubmit}>
        <label htmlFor="resource-id">Resource ID (optional)</label>
        <input
          id="resource-id"
          value={formData.resourceId}
          onChange={(event) => updateField('resourceId', event.target.value)}
          placeholder="e.g. 66124f0c9f6e4d3e5e0b1234"
        />

        <label htmlFor="location">Location</label>
        <input
          id="location"
          value={formData.location}
          onChange={(event) => updateField('location', event.target.value)}
          required
          maxLength={200}
        />

        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={formData.category}
          onChange={(event) => updateField('category', event.target.value)}
        >
          <option value="ELECTRICAL">Electrical</option>
          <option value="PLUMBING">Plumbing</option>
          <option value="IT_EQUIPMENT">IT Equipment</option>
          <option value="HVAC">HVAC</option>
          <option value="STRUCTURAL">Structural</option>
          <option value="OTHER">Other</option>
        </select>

        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          value={formData.priority}
          onChange={(event) => updateField('priority', event.target.value)}
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(event) => updateField('description', event.target.value)}
          required
          maxLength={2000}
        />

        <label htmlFor="contact-details">Contact Details</label>
        <input
          id="contact-details"
          value={formData.contactDetails}
          onChange={(event) => updateField('contactDetails', event.target.value)}
          required
          maxLength={255}
        />

        <ImageUploadPreview files={files} onChange={setFiles} />

        {error ? <p className="field-error">{error}</p> : null}

        <button type="submit" className="primary-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Ticket...' : 'Submit Ticket'}
        </button>
      </form>
    </main>
  );
}

export default CreateTicketPage;
