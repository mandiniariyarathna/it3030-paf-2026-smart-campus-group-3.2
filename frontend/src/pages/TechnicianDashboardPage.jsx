import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { getTickets, updateTicketStatus } from '../services/ticketService';

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

  const handleStatusUpdate = async (ticketId, status) => {
    try {
      const payload = { status };
      if (status === 'RESOLVED') {
        payload.resolutionNote = 'Resolved by technician.';
      }

      await updateTicketStatus(ticketId, payload);
      await loadTickets();
    } catch (statusError) {
      setError(statusError.message || 'Failed to update status.');
    }
  };

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

      <section className="ticket-table-panel">
        {isLoading ? <p>Loading tickets...</p> : null}
        {!isLoading && error ? <p className="field-error">{error}</p> : null}
        {!isLoading && !error && tickets.length === 0 ? <p>No assigned tickets found.</p> : null}

        {!isLoading && tickets.length > 0 ? (
          <div className="ticket-table-wrap">
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>{ticket.id.substring(0, 8)}...</td>
                    <td>{ticket.title}</td>
                    <td>{ticket.description.substring(0, 50)}...</td>
                    <td>{ticket.priority}</td>
                    <td>{ticket.status}</td>
                    <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="inline-actions">
                        {ticket.status === 'IN_PROGRESS' && (
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => handleStatusUpdate(ticket.id, 'RESOLVED')}
                          >
                            Resolve
                          </button>
                        )}
                        {ticket.status === 'OPEN' && (
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => handleStatusUpdate(ticket.id, 'IN_PROGRESS')}
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default TechnicianDashboardPage;
