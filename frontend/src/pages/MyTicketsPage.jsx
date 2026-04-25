import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PriorityBadge from '../components/PriorityBadge';
import TicketStatusBadge from '../components/TicketStatusBadge';
import { getTickets } from '../services/ticketService';

function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
        <div className="ticket-head-actions">
          <Link to="/tickets/create" className="primary-btn ticket-link-btn">
            Create Ticket
          </Link>
        </div>
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

        <div className="ticket-list-grid">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="ticket-list-card">
              <header>
                <h3>{ticket.location}</h3>
                <div className="ticket-badge-row">
                  <TicketStatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
              </header>
              <p>{ticket.description}</p>
              <small>Category: {ticket.category}</small>
              <Link to={`/tickets/${ticket.id}`} className="ticket-link-inline">
                View Details
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default MyTicketsPage;
