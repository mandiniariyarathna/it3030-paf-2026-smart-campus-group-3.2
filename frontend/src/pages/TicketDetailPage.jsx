import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import CommentSection from '../components/CommentSection';
import PriorityBadge from '../components/PriorityBadge';
import TicketStatusBadge from '../components/TicketStatusBadge';
import { getTicketById } from '../services/ticketService';

const STATUS_FLOW = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

function buildAttachmentImageUrl(attachment) {
  if (!attachment) {
    return '';
  }

  if (typeof attachment.url === 'string' && /^https?:\/\//i.test(attachment.url)) {
    return attachment.url;
  }

  const fileName = attachment.storedFileName || attachment.fileName;
  if (!fileName) {
    return '';
  }

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085').replace(/\/$/, '');
  return `${apiBaseUrl}/uploads/tickets/${encodeURIComponent(fileName)}`;
}

function TicketDetailPage() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [failedAttachmentIds, setFailedAttachmentIds] = useState([]);

  useEffect(() => {
    const loadTicket = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await getTicketById(ticketId);
        setTicket(data);
        setComments(data.comments || []);
        setFailedAttachmentIds([]);
      } catch (loadError) {
        setError(loadError.message || 'Failed to load ticket details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTicket();
  }, [ticketId]);

  const timelineStatus = useMemo(() => {
    if (!ticket) {
      return [];
    }

    const activeIndex = STATUS_FLOW.indexOf(ticket.status);

    return STATUS_FLOW.map((status, index) => ({
      status,
      done: activeIndex >= index,
      active: ticket.status === status,
    }));
  }, [ticket]);

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
    <main className="ticket-page">
      <header className="ticket-page-head">
        <div>
          <p className="home-kicker">Ticket Detail</p>
          <h1>{ticket.location}</h1>
          <p>{ticket.description}</p>
        </div>
        <div className="ticket-head-actions">
          <TicketStatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </header>

      {error ? <p className="field-error">{error}</p> : null}

      <section className="ticket-panel">
        <h3>Status Timeline</h3>
        <div className="ticket-timeline">
          {timelineStatus.map((node) => (
            <div
              key={node.status}
              className={`ticket-timeline-node ${node.done ? 'timeline-done' : ''} ${node.active ? 'timeline-active' : ''}`}
            >
              <span>{node.status.replaceAll('_', ' ')}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ticket-grid-2">
        <article className="ticket-panel">
          <h3>Ticket Info</h3>
          <dl className="ticket-info-grid">
            <div>
              <dt>Reporter</dt>
              <dd>{ticket.reporterId}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{ticket.category}</dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>{ticket.contactDetails}</dd>
            </div>
            <div>
              <dt>Assigned Technician</dt>
              <dd>{ticket.assignedTechnicianId || 'Unassigned'}</dd>
            </div>
          </dl>
        </article>

        <article className="ticket-panel">
          <h3>Attachments</h3>
          {ticket.attachments?.length ? (
            <div className="ticket-attachments-grid">
              {ticket.attachments.map((attachment) => {
                const imageUrl = buildAttachmentImageUrl(attachment);
                const isImageFailed = failedAttachmentIds.includes(attachment.attachmentId);

                return (
                  <figure key={attachment.attachmentId} className="ticket-attachment-card">
                    {isImageFailed ? (
                      <div>
                        <p>Preview unavailable.</p>
                        <a href={imageUrl} target="_blank" rel="noreferrer">
                          Open image
                        </a>
                      </div>
                    ) : (
                      <img
                        src={imageUrl}
                        alt={attachment.fileName}
                        onError={() => {
                          setFailedAttachmentIds((previous) =>
                            previous.includes(attachment.attachmentId)
                              ? previous
                              : [...previous, attachment.attachmentId]
                          );
                        }}
                      />
                    )}
                    <figcaption>{attachment.fileName}</figcaption>
                  </figure>
                );
              })}
            </div>
          ) : (
            <p>No attachments uploaded.</p>
          )}
        </article>
      </section>

      <CommentSection
        ticketId={ticket.id}
        comments={comments}
        onCommentsUpdated={(nextComments) => setComments(nextComments)}
      />
    </main>
  );
}

export default TicketDetailPage;
