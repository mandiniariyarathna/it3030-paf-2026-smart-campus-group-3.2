import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PriorityBadge from '../components/PriorityBadge';
import TicketStatusBadge from '../components/TicketStatusBadge';
import { getCurrentActor, getTickets, deleteTicket } from '../services/ticketService';

const CATEGORY_OPTIONS = [
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'IT_TECHNICAL', label: 'IT & Technical' },
  { value: 'FACILITY_RESOURCE_BASED', label: 'Facility / Resource-Based' },
  { value: 'SAFETY_SECURITY', label: 'Safety & Security' },
  { value: 'GENERAL', label: 'General' },
  { value: 'ELECTRICAL', label: 'Electrical (Legacy)' },
  { value: 'PLUMBING', label: 'Plumbing (Legacy)' },
  { value: 'IT_EQUIPMENT', label: 'IT Equipment (Legacy)' },
  { value: 'HVAC', label: 'HVAC (Legacy)' },
  { value: 'STRUCTURAL', label: 'Structural (Legacy)' },
  { value: 'OTHER', label: 'Other (Legacy)' },
];

function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const actor = getCurrentActor();
  const isTechnician = actor.role === 'TECHNICIAN';

  useEffect(() => {
    const loadTickets = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await getTickets();
        setTickets(data);
      } catch (loadError) {
        setError(loadError.message || 'Failed to load tickets.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, []);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((ticket) => ['OPEN', 'IN_PROGRESS'].includes(ticket.status)).length;
    const resolved = tickets.filter((ticket) => ticket.status === 'RESOLVED').length;
    return { total, open, resolved };
  }, [tickets]);

  const handleDelete = async (ticketId) => {
    if (!window.confirm('Are you sure you want to permanently delete this ticket?')) {
      return;
    }

    try {
      await deleteTicket(ticketId);
      setTickets(tickets.filter((ticket) => ticket.id !== ticketId));
    } catch (error) {
      alert(error.message || 'Failed to delete ticket.');
    }
  };

  return (
    <main className="ticket-page">
      <header className="ticket-page-head">
        <div>
          <p className="home-kicker">Maintenance & Incident Ticketing</p>
          <h1>My Tickets</h1>
          <p>Track your submitted incidents and view updates from technicians.</p>
        </div>
        {!isTechnician ? (
          <div className="ticket-head-actions">
            <Link to="/tickets/create" className="primary-btn ticket-link-btn">
              Create Ticket
            </Link>
          </div>
        ) : null}
      </header>

      <section className="ticket-stats">
        <article>
          <p>Total Tickets</p>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <p>Open / In Progress</p>
          <strong>{stats.open}</strong>
        </article>
        <article>
          <p>Resolved</p>
          <strong>{stats.resolved}</strong>
        </article>
      </section>

      <section className="ticket-list-panel">
        {isLoading ? <p>Loading tickets...</p> : null}
        {!isLoading && error ? <p className="field-error">{error}</p> : null}
        {!isLoading && !error && tickets.length === 0 ? <p>No tickets created yet.</p> : null}

        <ul className="ticket-list" aria-label="My tickets">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="ticket-list-item">
              <div className="ticket-list-link">
                <div className="ticket-list-main">
                  <h3>{ticket.location}</h3>
                  <p>{ticket.description}</p>
                  <small>Category: {ticket.category}</small>
                </div>

                <div className="ticket-list-meta">
                  <div className="ticket-badge-row">
                    <TicketStatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <div className="ticket-ticket-actions">
                    <Link to={`/tickets/${ticket.id}`} className="ticket-list-action">
                      View Details
                    </Link>
                    {!isTechnician && ticket.status === 'OPEN' ? (
                      <>
                        <Link to={`/tickets/${ticket.id}/edit`} className="ticket-edit-btn-link">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(ticket.id)}
                          className="ticket-delete-btn"
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default MyTicketsPage;
