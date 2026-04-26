import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import BookingCard from '../components/BookingCard';
import BookingDetailModal from '../components/BookingDetailModal';
import { cancelBooking, getBookings } from '../services/bookingService';
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

function buildStatusSummary(bookings) {
  return bookings.reduce(
    (summary, booking) => {
      summary.total += 1;
      const statusKey = booking.status?.toLowerCase() || 'other';
      summary[statusKey] = (summary[statusKey] || 0) + 1;
      return summary;
    },
    { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0, other: 0 }
  );
}

function buildBookingsReportPdf(bookings, summary) {
  const document = new jsPDF();
  const generatedAt = new Date().toLocaleString();

  document.setFont('helvetica', 'bold');
  document.setFontSize(18);
  document.text('My Bookings Report', 14, 18);

  document.setFont('helvetica', 'normal');
  document.setFontSize(10);
  document.text(`Generated at: ${generatedAt}`, 14, 26);
  document.text(`Total bookings: ${summary.total}`, 14, 32);
  document.text(`Approved: ${summary.approved}   Pending: ${summary.pending}   Other: ${summary.rejected + summary.cancelled + summary.other}`, 14, 38);

  autoTable(document, {
    startY: 46,
    head: [[
      'Booking ID',
      'Purpose',
      'Resource',
      'Date',
      'Time',
      'Status',
      'Attendees',
      'Rejection Reason',
    ]],
    body: bookings.map((booking) => [
      booking.id,
      booking.purpose || '-',
      booking.resourceName || booking.resourceId || 'Unknown resource',
      booking.date || '-',
      `${booking.startTime || '-'} - ${booking.endTime || '-'}`,
      booking.status || '-',
      booking.expectedAttendees || '-',
      booking.rejectionReason || '-',
    ]),
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [20, 125, 121],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 250, 249],
    },
    margin: { left: 14, right: 14 },
  });

  document.save(`my-bookings-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBookings = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [bookingData, resourceData] = await Promise.all([getBookings(), getResources()]);
      setBookings(attachResourceNames(bookingData, resourceData));
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

  const handleEdit = (booking) => {
    navigate(`/bookings/new?editBookingId=${booking.id}`);
  };

  const handleRepeat = (booking) => {
    setSelectedBooking(null);
    navigate(`/bookings/repeat?bookingId=${booking.id}`);
  };

  const reportSummary = useMemo(() => buildStatusSummary(bookings), [bookings]);

  const handleDownloadReport = () => {
    if (bookings.length === 0) {
      setError('No bookings available to export.');
      return;
    }

    try {
      setError('');
      buildBookingsReportPdf(bookings, reportSummary);
    } catch (downloadError) {
      setError(downloadError.message || 'Unable to generate bookings report.');
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
          <button
            type="button"
            className="booking-btn booking-btn-secondary booking-report-btn"
            onClick={handleDownloadReport}
            disabled={bookings.length === 0 || isLoading}
          >
            Download PDF Report
          </button>
          <Link to="/home" className="ghost-btn booking-nav-link">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <section className="booking-report-summary" aria-label="booking report summary">
        <article className="booking-report-card">
          <span>Total</span>
          <strong>{reportSummary.total}</strong>
        </article>
        <article className="booking-report-card">
          <span>Approved</span>
          <strong>{reportSummary.approved}</strong>
        </article>
        <article className="booking-report-card">
          <span>Pending</span>
          <strong>{reportSummary.pending}</strong>
        </article>
        <article className="booking-report-card">
          <span>Completed/Other</span>
          <strong>{reportSummary.rejected + reportSummary.cancelled + reportSummary.other}</strong>
        </article>
      </section>

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
            onEdit={handleEdit}
            onRepeat={handleRepeat}
            onCancel={handleCancel}
          />
        ))}
      </section>

      <BookingDetailModal
        booking={selectedBooking}
        isAdmin={false}
        onClose={() => setSelectedBooking(null)}
        onEdit={handleEdit}
        onRepeat={handleRepeat}
        onCancel={handleCancel}
      />
    </main>
  );
}

export default MyBookingsPage;
