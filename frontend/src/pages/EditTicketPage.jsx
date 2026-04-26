import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import TicketForm from '../components/TicketForm';
import { getResources } from '../services/resourceService';
import { getTicketById, updateTicket } from '../services/ticketService';

const CATEGORY_FROM_PERSISTED_VALUE = {
  STRUCTURAL: 'MAINTENANCE',
  IT_EQUIPMENT: 'IT_TECHNICAL',
  OTHER: 'GENERAL',
  ELECTRICAL: 'GENERAL',
  PLUMBING: 'MAINTENANCE',
  HVAC: 'MAINTENANCE',
};

const CATEGORY_TO_PERSISTED_VALUE = {
  MAINTENANCE: 'STRUCTURAL',
  IT_TECHNICAL: 'IT_EQUIPMENT',
  FACILITY_RESOURCE_BASED: 'STRUCTURAL',
  SAFETY_SECURITY: 'OTHER',
  GENERAL: 'OTHER',
};

const defaultForm = {
  resourceId: '',
  location: '',
  category: 'GENERAL',
  description: '',
  priority: 'MEDIUM',
  contactDetails: '',
};

function EditTicketPage() {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [formData, setFormData] = useState(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState('');
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    const loadResources = async () => {
      setResourcesLoading(true);
      setResourcesError('');
      try {
        const data = await getResources();
        setResources(data || []);
      } catch (loadError) {
        setResourcesError(loadError.message || 'Failed to load resources');
        setResources([]);
      } finally {
        setResourcesLoading(false);
      }
    };

    loadResources();
  }, []);

  useEffect(() => {
    const loadTicket = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await getTicketById(ticketId);
        setTicket(data);

        if (data.status !== 'OPEN') {
          setError('Only open tickets can be edited.');
          return;
        }

        setFormData({
          resourceId: data.resourceId || '',
          location: data.location || '',
          category: CATEGORY_FROM_PERSISTED_VALUE[data.category] || data.category || 'GENERAL',
          description: data.description || '',
          priority: data.priority || 'MEDIUM',
          contactDetails: data.contactDetails || '',
        });
      } catch (loadError) {
        setError(loadError.message || 'Failed to load ticket for editing.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTicket();
  }, [ticketId]);

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleResourceSelect = (resourceId) => {
    const selected = resources.find((resource) => resource.id === resourceId);
    updateField('resourceId', resourceId);

    if (selected?.location) {
      updateField('location', selected.location);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const persistedCategory = CATEGORY_TO_PERSISTED_VALUE[formData.category] || formData.category;
      const payload = {
        location: formData.location.trim(),
        category: persistedCategory,
        description: formData.description.trim(),
        priority: formData.priority,
        contactDetails: formData.contactDetails.trim(),
        resourceId: formData.resourceId.trim() || null,
      };

      const updated = await updateTicket(ticketId, payload);
      navigate(`/tickets/${updated.id}`);
    } catch (submitError) {
      setError(submitError.message || 'Failed to update ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="ticket-page">
        <p>Loading ticket details...</p>
      </main>
    );
  }

  if (error && !ticket) {
    return (
      <main className="ticket-page">
        <p className="field-error">{error}</p>
        <Link to="/tickets/my" className="ticket-link-inline">
          Back to Tickets
        </Link>
      </main>
    );
  }

  return (
    <TicketForm
      heading={`Edit Ticket - ${ticket?.location || ''}`}
      description="Update the ticket details while the ticket is still open."
      backLink={`/tickets/${ticketId}`}
      backLinkLabel="View Details"
      formData={formData}
      resources={resources}
      resourcesLoading={resourcesLoading}
      resourcesError={resourcesError}
      onFieldChange={updateField}
      onResourceSelect={handleResourceSelect}
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/tickets/${ticketId}`)}
      submitLabel={isSubmitting ? 'Saving Changes...' : 'Save Changes'}
      isSubmitting={isSubmitting}
      error={error}
      includeAttachments={false}
      showResourceSelector={true}
    />
  );
}

export default EditTicketPage;