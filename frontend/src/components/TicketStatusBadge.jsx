const STATUS_CLASS_MAP = {
  OPEN: 'status-open',
  IN_PROGRESS: 'status-in-progress',
  RESOLVED: 'status-resolved',
  CLOSED: 'status-closed',
  REJECTED: 'status-rejected',
};

function formatStatus(status) {
  return (status || 'UNKNOWN').replaceAll('_', ' ');
}

function TicketStatusBadge({ status }) {
  const normalized = (status || 'UNKNOWN').toUpperCase();
  const className = STATUS_CLASS_MAP[normalized] || 'status-default';

  return <span className={`ticket-badge ${className}`}>{formatStatus(normalized)}</span>;
}

export default TicketStatusBadge;
