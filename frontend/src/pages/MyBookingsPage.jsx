import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import BookingCard from '../components/BookingCard';
import BookingDetailModal from '../components/BookingDetailModal';
import { cancelBooking, getBookings } from '../services/bookingService';

function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBookings = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await getBookings();
      setBookings(data);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load your bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (booking) => {
    const confirmed = window.confirm(`Cancel booking for ${booking.date} ${booking.startTime}-${booking.endTime}?`);

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      await cancelBooking(booking.id);
      await loadBookings();
      setSelectedBooking(null);
    } catch (cancelError) {
      setError(cancelError.message || 'Unable to cancel booking.');
    }
  };

  return (
    <main className="booking-page">
      <header className="booking-head">
        <div>
          <p className="home-kicker">Booking Management</p>
          <h1>My Bookings</h1>
          <p className="booking-copy">Track your booking requests, approvals, and cancellations in one view.</p>
        </div>
        <div className="booking-head-actions">
          <Link to="/bookings/new" className="primary-btn booking-nav-link-primary">
            New Booking Request
          </Link>
          <Link to="/home" className="ghost-btn booking-nav-link">
            Back to Dashboard
          </Link>
        </div>
      </header>

      {isLoading ? <p className="resource-feedback">Loading your bookings...</p> : null}
      {!isLoading && error ? <p className="field-error">{error}</p> : null}
      {!isLoading && !error && bookings.length === 0 ? (
        <p className="resource-feedback">No bookings yet. Create your first booking request.</p>
      ) : null}

      <section className="booking-list" aria-label="my bookings list">
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            isAdmin={false}
            onView={setSelectedBooking}
            onCancel={handleCancel}
          />
        ))}
      </section>

      <BookingDetailModal booking={selectedBooking} isAdmin={false} onClose={() => setSelectedBooking(null)} onCancel={handleCancel} />
    </main>
  );
}

export default MyBookingsPage;
