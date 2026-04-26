import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import PriorityBadge from '../components/PriorityBadge';
import TicketStatusBadge from '../components/TicketStatusBadge';
import { getTickets } from '../services/ticketService';
import { getCategoryLabel } from '../utils/categoryUtils';

function TechnicianDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = JSON.parse(localStorage.getItem('smart-campus-session') || 'null');
  const technicianId = location.state?.technicianId || session?.technicianId;
  const displayName = location.state?.displayName || session?.displayName || 'Technician';

  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTickets = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await getTickets({});
      const assignedTickets = data.filter((ticket) => ticket.assignedTechnicianId === technicianId);
      setTickets(assignedTickets);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load tickets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!technicianId) {
      navigate('/login');
      return;
    }
    loadTickets();
  }, [technicianId]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((ticket) => ['OPEN', 'IN_PROGRESS'].includes(ticket.status)).length;
    const resolved = tickets.filter((ticket) => ticket.status === 'RESOLVED').length;
    return { total, open, resolved };
  }, [tickets]);

  const handleSignOut = () => {
    localStorage.removeItem('smart-campus-session');
    navigate('/login', {
      replace: true,
    });
  };

  return (
    <main className="ticket-page">
      <header className="ticket-page-head">
        <div>
          <p className="home-kicker">Maintenance & Incident Ticketing</p>
          <h1>Technician Dashboard</h1>
          <p>Welcome, {displayName} - Manage your assigned tickets.</p>
        </div>
        <button type="button" className="ghost-btn" onClick={handleSignOut}>
          Sign Out
        </button>
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
        {!isLoading && !error && tickets.length === 0 ? <p>No assigned tickets found.</p> : null}

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
              <small>Category: {getCategoryLabel(ticket.category)}</small>
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

export default TechnicianDashboardPage;
