import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PriorityBadge from '../components/PriorityBadge';
import TicketStatusBadge from '../components/TicketStatusBadge';
import { assignTechnician, getTickets, updateTicketStatus } from '../services/ticketService';
import { getTechnicians } from '../services/technicianService';
import { getCategoryLabel } from '../utils/categoryUtils';

const defaultFilters = {
  status: '',
  priority: '',
  category: '',
};

const CATEGORY_SPECIALIZATION_MAP = {
  MAINTENANCE: ['Maintenance'],
  IT_TECHNICAL: ['IT & Technical'],
  FACILITY_RESOURCE_BASED: ['Facility / Resource-Based'],
  SAFETY_SECURITY: ['Safety & Security'],
  GENERAL: ['General'],
  // Legacy categories for backward compatibility
  ELECTRICAL: ['Maintenance'],
  PLUMBING: ['Maintenance'],
  IT_EQUIPMENT: ['IT & Technical'],
  HVAC: ['Maintenance'],
  STRUCTURAL: ['Maintenance'],
  OTHER: ['General'],
};

function getTechnicianOptionsForCategory(category, technicians) {
  const allowedSpecializations = CATEGORY_SPECIALIZATION_MAP[category] || [];
  const normalizedAllowedSpecializations = allowedSpecializations.map((specialization) => specialization.toLowerCase());

  return technicians.filter((technician) => {
    const specialization = (technician.specialization || '').trim().toLowerCase();
    return normalizedAllowedSpecializations.includes(specialization);
  });
}

function AdminTicketsPage({ embedded = false }) {
  const [filters, setFilters] = useState(defaultFilters);
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const queryFilters = useMemo(() => ({ ...filters }), [filters]);
  const technicianNameById = useMemo(
    () => new Map(technicians.map((technician) => [technician.id, technician.name])),
    [technicians]
  );

  const loadTechnicians = async () => {
    try {
      const data = await getTechnicians(true);
      setTechnicians(data);
    } catch (loadError) {
      console.error('Failed to load technicians:', loadError);
    }
  };

  const loadTickets = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await getTickets(queryFilters);
      setTickets(data);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load tickets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    loadTechnicians();
  }, [queryFilters]);

  const handleStatusUpdate = async (ticketId, status, additionalData = {}) => {
    try {
      const payload = { status };
      if (status === 'RESOLVED') {
        payload.resolutionNote = additionalData.resolutionNote || 'Resolved by maintenance team.';
      }
      if (status === 'REJECTED') {
        payload.rejectionReason = additionalData.rejectionReason || 'Insufficient evidence provided.';
      }

      await updateTicketStatus(ticketId, payload);
      await loadTickets();
    } catch (statusError) {
      setError(statusError.message || 'Failed to update status.');
    }
  };

  const handleAssign = async (ticketId, technicianId) => {
    if (!technicianId) {
      return;
    }

    try {
      await assignTechnician(ticketId, technicianId);
      await loadTickets();
    } catch (assignError) {
      setError(assignError.message || 'Failed to assign technician.');
    }
  };

  const handleReject = async (ticketId) => {
    const rejectionReason = window.prompt('Enter reason for rejection:');
    if (!rejectionReason?.trim()) {
      return;
    }

    await handleStatusUpdate(ticketId, 'REJECTED', { rejectionReason: rejectionReason.trim() });
  };

  const WrapperTag = embedded ? 'section' : 'main';

  return (
    <WrapperTag
      className={`ticket-page ticket-page-admin-desk ${embedded ? 'ticket-page-embedded' : ''}`.trim()}
      aria-label="admin technician ticket desk"
    >
      <header className="ticket-page-head ticket-page-head-admin">
        <div>
          <p className="home-kicker">Maintenance & Incident Ticketing</p>
          <h1>Admin / Technician Ticket Desk</h1>
          <p>Filter, assign, and progress incident tickets from one control panel.</p>
        </div>
        <Link to="/admin/technicians" className="ticket-link-btn ticket-link-btn-admin">
          Manage Technicians
        </Link>
      </header>

      <section className="ticket-filter-row ticket-filter-row-admin">
        <select value={filters.status} onChange={(event) => setFilters((previous) => ({ ...previous, status: event.target.value }))}>
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select value={filters.priority} onChange={(event) => setFilters((previous) => ({ ...previous, priority: event.target.value }))}>
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select value={filters.category} onChange={(event) => setFilters((previous) => ({ ...previous, category: event.target.value }))}>
          <option value="">All Categories</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="IT_TECHNICAL">IT &amp; Technical</option>
          <option value="FACILITY_RESOURCE_BASED">Facility / Resource-Based</option>
          <option value="SAFETY_SECURITY">Safety &amp; Security</option>
          <option value="GENERAL">General</option>
        </select>
      </section>

      <section className="ticket-table-panel ticket-table-panel-admin">
        {isLoading ? <p>Loading tickets...</p> : null}
        {!isLoading && error ? <p className="field-error">{error}</p> : null}
        {!isLoading && !error && tickets.length === 0 ? <p>No tickets found for current filters.</p> : null}

        {!isLoading && tickets.length > 0 ? (
          <div className="ticket-table-wrap">
            <table className="ticket-table ticket-table-admin">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Category</th>
                  <th>Reporter</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assigned Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <Link to={`/tickets/${ticket.id}`} className="ticket-link-inline">
                        {ticket.location}
                      </Link>
                    </td>
                    <td>{getCategoryLabel(ticket.category)}</td>
                    <td>{ticket.reporterId}</td>
                    <td>
                      <TicketStatusBadge status={ticket.status} />
                    </td>
                    <td>
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td>{technicianNameById.get(ticket.assignedTechnicianId) || 'Unassigned'}</td>
                    <td>
                      <div className="inline-actions inline-actions-admin">
                        <select
                          value={ticket.assignedTechnicianId || ''}
                          onChange={(e) => handleAssign(ticket.id, e.target.value)}
                          disabled={ticket.status !== 'OPEN'}
                          className="ticket-assign-select"
                        >
                          <option value="">Select Technician</option>
                          {getTechnicianOptionsForCategory(ticket.category, technicians).map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {tech.name} ({tech.specialization || 'General'})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="ticket-reject-btn"
                          onClick={() => handleReject(ticket.id)}
                          disabled={ticket.status !== 'OPEN'}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </WrapperTag>
  );
}

export default AdminTicketsPage;
