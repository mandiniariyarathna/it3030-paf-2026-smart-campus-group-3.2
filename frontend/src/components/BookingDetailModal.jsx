import { useState } from 'react';

function BookingDetailModal({ booking, isAdmin, onClose, onApprove, onReject, onCancel, onEdit, onRepeat }) {
  const [reason, setReason] = useState('');

  if (!booking) {
    return null;
  }

  const canAct = booking.status === 'PENDING';
  const resourceLabel = booking.resourceName || booking.resourceId;

  return (
    <div className="booking-modal-overlay" role="dialog" aria-modal="true" aria-label="Booking details">
      <section className="booking-modal">
        <header className="booking-modal-head">
          <h2>Booking Detail</h2>
          <button type="button" className="booking-close" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="booking-modal-grid">
          <p>
            <strong>Purpose:</strong> {booking.purpose}
          </p>
          <p>
            <strong>Resource:</strong> {resourceLabel}
          </p>
          <p>
            <strong>Date:</strong> {booking.date}
          </p>
          <p>
            <strong>Time:</strong> {booking.startTime} - {booking.endTime}
          </p>
          <p>
            <strong>Status:</strong> {booking.status}
          </p>
          <p>
            <strong>Expected attendees:</strong> {booking.expectedAttendees || 'Not specified'}
          </p>
        </div>

        {booking.rejectionReason ? <p className="booking-reason">Reason: {booking.rejectionReason}</p> : null}

        <footer className="booking-modal-actions">
          {onEdit && booking.status === 'PENDING' ? (
            <button type="button" className="booking-btn booking-btn-secondary" onClick={() => onEdit(booking)}>
              Edit Booking
            </button>
          ) : null}

          {onRepeat && booking.status === 'APPROVED' ? (
            <button type="button" className="booking-btn booking-btn-repeat" onClick={() => onRepeat(booking)}>
              Repeat Booking
            </button>
          ) : null}

          {onCancel && (booking.status === 'PENDING' || booking.status === 'APPROVED') ? (
            <button type="button" className="booking-btn booking-btn-danger" onClick={() => onCancel(booking)}>
              Cancel Booking
            </button>
          ) : null}

          {isAdmin && canAct ? (
            <>
              <button type="button" className="booking-btn booking-btn-success" onClick={() => onApprove(booking)}>
                Approve
              </button>
              <input
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Rejection reason"
                className="booking-inline-input"
              />
              <button
                type="button"
                className="booking-btn booking-btn-warning"
                onClick={() => onReject(booking, reason)}
              >
                Reject
              </button>
            </>
          ) : null}
        </footer>
      </section>
    </div>
  );
}

export default BookingDetailModal;
