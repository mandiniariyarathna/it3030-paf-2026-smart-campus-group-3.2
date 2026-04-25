import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import BookingCard from '../components/BookingCard';
import BookingDetailModal from '../components/BookingDetailModal';
import { approveBooking, getBookings, rejectBooking } from '../services/bookingService';
import { getResources } from '../services/resourceService';

function attachResourceNames(bookings, resources) {
  const resourceNameById = resources.reduce((accumulator, resource) => {
    accumulator[resource.id] = resource.name;
    return accumulator;
  }, {});

  return bookings.map((booking) => ({
    ...booking,
    resourceName: resourceNameById[booking.resourceId] || 'Unknown resource',
  }));
}

function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const pendingCount = useMemo(
    () => bookings.filter((booking) => booking.status === 'PENDING').length,
    [bookings]
  );

  const loadBookings = async (status = '') => {
    setIsLoading(true);
    setError('');

    try {
      const [bookingData, resourceData] = await Promise.all([
        getBookings(status || undefined),
        getResources(),
      ]);
      setBookings(attachResourceNames(bookingData, resourceData));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings(statusFilter);
  }, [statusFilter]);

  const handleApprove = async (booking) => {
    try {
      setError('');
      await approveBooking(booking.id);
      await loadBookings(statusFilter);
      setSelectedBooking(null);
    } catch (approveError) {
      const message = approveError.message || 'Unable to approve booking.';
      if (message.toLowerCase().includes('conflict')) {
        setError('Approval failed: another approved booking overlaps with this time slot.');
      } else {
        setError(message);
      }
    }
  };

  const handleReject = async (booking, reason) => {
    if (!reason || !reason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }

    try {
      setError('');
      await rejectBooking(booking.id, reason.trim());
      await loadBookings(statusFilter);
      setSelectedBooking(null);
    } catch (rejectError) {
      setError(rejectError.message || 'Unable to reject booking.');
    }
  };

  return (
    <main className="booking-page admin-booking-page">
      <header className="booking-head">
        <div>
          <p className="home-kicker">Booking Management</p>
          <h1>Admin Bookings</h1>
          <p className="booking-copy">Review all requests, approve valid slots, and reject conflicts with clear reasons.</p>
          <p className="booking-hint">
            Pending approvals: <strong>{pendingCount}</strong>
          </p>
        </div>
        <div className="booking-head-actions">
          <Link to="/admin" className="ghost-btn booking-nav-link">
            Back to Admin Dashboard
          </Link>
        </div>
      </header>

      <section className="booking-filter-bar" aria-label="booking filter">
        <label htmlFor="statusFilter">Status</label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </section>

      {isLoading ? <p className="resource-feedback">Loading bookings...</p> : null}
      {!isLoading && error ? <p className="field-error">{error}</p> : null}
      {!isLoading && !error && bookings.length === 0 ? <p className="resource-feedback">No bookings found.</p> : null}

      <section className="booking-list" aria-label="admin bookings list">
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            isAdmin
            onView={setSelectedBooking}
            onApprove={handleApprove}
            onReject={(item) => handleReject(item, 'Resource not available in requested slot')}
          />
        ))}
      </section>

      <BookingDetailModal
        booking={selectedBooking}
        isAdmin
        onClose={() => setSelectedBooking(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </main>
  );
}

export default AdminBookingsPage;
