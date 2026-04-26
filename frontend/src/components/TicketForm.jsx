import { Link } from 'react-router-dom';

import ImageUploadPreview from './ImageUploadPreview';

const CATEGORY_OPTIONS = [
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'IT_TECHNICAL', label: 'IT & Technical' },
  { value: 'FACILITY_RESOURCE_BASED', label: 'Facility / Resource-Based' },
  { value: 'SAFETY_SECURITY', label: 'Safety & Security' },
  { value: 'GENERAL', label: 'General' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

function TicketForm({
  formData,
  resources,
  resourcesLoading,
  resourcesError,
  onFieldChange,
  onResourceSelect,
  onSubmit,
  onCancel,
  submitLabel,
  submittingLabel,
  isSubmitting,
  error,
  files,
  onFilesChange,
  includeAttachments = true,
  showResourceSelector = true,
  heading,
  description,
  backLink,
  backLinkLabel,
}) {
  return (
    <main className="ticket-page">
      <header className="ticket-page-head">
        <div>
          <p className="home-kicker">Maintenance & Incident Ticketing</p>
          <h1>{heading}</h1>
          <p>{description}</p>
        </div>
        {backLink ? (
          <Link to={backLink} className="ghost-btn ticket-link-btn">
            {backLinkLabel}
          </Link>
        ) : null}
      </header>

      <form className="ticket-form" onSubmit={onSubmit}>
        {showResourceSelector ? (
          <div className="form-field">
            <label htmlFor="resource-select">Select Related Resource (Optional)</label>
            <select
              id="resource-select"
              value={formData.resourceId}
              onChange={(event) => onResourceSelect(event.target.value)}
              disabled={resourcesLoading}
              className="resource-selector"
            >
              <option value="">-- Choose a resource --</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name} ({resource.type}) - {resource.location}
                </option>
              ))}
            </select>
            {resourcesError && <p className="field-error">{resourcesError}</p>}
            {resourcesLoading && <p className="field-help">Loading resources...</p>}
          </div>
        ) : null}

        <div className="form-field">
          <label htmlFor="location">Location *</label>
          <input
            id="location"
            type="text"
            value={formData.location}
            onChange={(event) => onFieldChange('location', event.target.value)}
            placeholder="Enter ticket location"
            required
            maxLength={200}
          />
        </div>

        <div className="form-field">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            value={formData.category}
            onChange={(event) => {
              const newCategory = event.target.value;
              onFieldChange('category', newCategory);
              
              // Auto-set priority based on category
              let newPriority = 'LOW'; // Default
              if (newCategory === 'IT_TECHNICAL' || newCategory === 'IT_EQUIPMENT') {
                newPriority = 'HIGH';
              } else if (newCategory === 'MAINTENANCE') {
                newPriority = 'HIGH';
              } else if (newCategory === 'SAFETY_SECURITY') {
                newPriority = 'CRITICAL';
              } else if (newCategory === 'FACILITY_RESOURCE_BASED' || newCategory === 'GENERAL') {
                newPriority = 'LOW';
              }
              onFieldChange('priority', newPriority);
            }}
            required
          >
            <option value="">-- Select category --</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="priority">Priority (Auto-set based on Category) *</label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(event) => onFieldChange('priority', event.target.value)}
            required
            disabled
            className="disabled-select"
            title="Priority is automatically set based on the selected category"
          >
            <option value="">-- Select priority --</option>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(event) => onFieldChange('description', event.target.value)}
            placeholder="Describe the issue in detail..."
            required
            maxLength={2000}
            rows={5}
          />
        </div>

        <div className="form-field">
          <label htmlFor="contact-details">Contact Details *</label>
          <input
            id="contact-details"
            type="text"
            value={formData.contactDetails}
            onChange={(event) => onFieldChange('contactDetails', event.target.value)}
            placeholder="Your email or phone number"
            required
            maxLength={255}
          />
        </div>

        {includeAttachments ? (
          <div className="form-field">
            <label>Attach Supporting Files (Max 3 images, 5MB each)</label>
            <ImageUploadPreview files={files} onChange={onFilesChange} />
          </div>
        ) : null}

        {error && <p className="field-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="primary-btn" disabled={isSubmitting || resourcesLoading}>
            {isSubmitting ? (submittingLabel || submitLabel) : submitLabel}
          </button>
          {onCancel ? (
            <button type="button" className="ghost-btn" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </main>
  );
}

export default TicketForm;