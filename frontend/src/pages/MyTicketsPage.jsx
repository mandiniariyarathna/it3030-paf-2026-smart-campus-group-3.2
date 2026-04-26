import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PriorityBadge from '../components/PriorityBadge';
import TicketStatusBadge from '../components/TicketStatusBadge';
import { getCurrentActor, getTickets } from '../services/ticketService';

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
              <Link to={`/tickets/${ticket.id}`} className="ticket-list-link">
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
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default MyTicketsPage;
