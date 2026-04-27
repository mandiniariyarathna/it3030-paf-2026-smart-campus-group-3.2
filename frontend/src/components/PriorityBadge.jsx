const PRIORITY_CLASS_MAP = {
  LOW: 'priority-low',
  MEDIUM: 'priority-medium',
  HIGH: 'priority-high',
  CRITICAL: 'priority-critical',
};

function PriorityBadge({ priority }) {
  const normalized = (priority || 'LOW').toUpperCase();
  const className = PRIORITY_CLASS_MAP[normalized] || 'priority-low';

  return <span className={`ticket-badge ${className}`}>{normalized}</span>;
}

export default PriorityBadge;
