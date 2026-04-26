import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import TicketForm from '../components/TicketForm';
import { getResources } from '../services/resourceService';
import { createTicket } from '../services/ticketService';

const defaultForm = {
  resourceId: '',
  location: '',
  category: 'GENERAL',
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
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState('');

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
    <TicketForm
      heading="Create a New Ticket"
      description="Report issues quickly with clear details and optional photo evidence."
      backLink="/tickets/my"
      backLinkLabel="View My Tickets"
      formData={formData}
      resources={resources}
      resourcesLoading={resourcesLoading}
      resourcesError={resourcesError}
      onFieldChange={updateField}
      onResourceSelect={handleResourceSelect}
      onSubmit={handleSubmit}
      submitLabel={isSubmitting ? 'Creating Ticket...' : 'Submit Ticket'}
      isSubmitting={isSubmitting}
      error={error}
      files={files}
      onFilesChange={setFiles}
      includeAttachments={true}
      showResourceSelector={true}
    />
  );
}

export default CreateTicketPage;