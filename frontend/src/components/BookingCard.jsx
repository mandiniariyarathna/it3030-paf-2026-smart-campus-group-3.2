function BookingCard({ booking, isAdmin, onView, onCancel, onApprove, onReject, onEdit }) {
  const statusClass = `booking-status booking-status-${(booking.status || '').toLowerCase()}`;
  const resourceLabel = booking.resourceName || booking.resourceId;

  return (
    <article className="booking-card">
      <header className="booking-card-head">
        <h3>{booking.purpose}</h3>
        <span className={statusClass}>{booking.status}</span>
      </header>

      <p className="booking-resource-line">
        <span>Resource</span>
        <strong>{resourceLabel}</strong>
      </p>

      <dl className="booking-meta">
        <div>
          <dt>Date</dt>
          <dd>{booking.date}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>
            {booking.startTime} - {booking.endTime}
          </dd>
        </div>
      </dl>

      <div className="booking-card-actions">
        <button type="button" className="booking-btn booking-btn-ghost" onClick={() => onView(booking)}>
          View
        </button>

        {booking.status === 'PENDING' && onEdit ? (
          <button type="button" className="booking-btn booking-btn-secondary" onClick={() => onEdit(booking)}>
            Edit
          </button>
        ) : null}

        {(booking.status === 'PENDING' || booking.status === 'APPROVED') && onCancel ? (
          <button type="button" className="booking-btn booking-btn-danger" onClick={() => onCancel(booking)}>
            Cancel
          </button>
        ) : null}

        {isAdmin && booking.status === 'PENDING' && onApprove ? (
          <button type="button" className="booking-btn booking-btn-success" onClick={() => onApprove(booking)}>
            Approve
          </button>
        ) : null}

        {isAdmin && booking.status === 'PENDING' && onReject ? (
          <button type="button" className="booking-btn booking-btn-warning" onClick={() => onReject(booking)}>
            Reject
          </button>
        ) : null}
      </div>

      {booking.rejectionReason ? (
        <p className="booking-reason">Rejection reason: {booking.rejectionReason}</p>
      ) : null}
    </article>
  );
}

export default BookingCard;
