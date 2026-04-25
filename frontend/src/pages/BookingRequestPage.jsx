import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { createBookingRequest, getBookingsForResource } from '../services/bookingService';
import { getResources } from '../services/resourceService';

const initialForm = {
  resourceId: '',
  date: '',
  startTime: '',
  endTime: '',
  purpose: '',
  expectedAttendees: '',
};

function BookingRequestPage() {
  const [form, setForm] = useState(initialForm);
  const [resources, setResources] = useState([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  useEffect(() => {
    const loadResources = async () => {
      setIsLoadingResources(true);
      setError('');

      try {
        const data = await getResources({ status: 'ACTIVE' });
        setResources(data);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load resources for booking.');
      } finally {
        setIsLoadingResources(false);
      }
    };

    loadResources();
  }, []);

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.id === form.resourceId),
    [resources, form.resourceId]
  );

  useEffect(() => {
    const shouldCheckConflicts =
      form.resourceId && form.date && form.startTime && form.endTime;

    if (!shouldCheckConflicts) {
      setConflicts([]);
      return;
    }

    const findConflicts = async () => {
      setIsCheckingConflicts(true);

      try {
        const bookings = await getBookingsForResource(form.resourceId);
        const overlapping = bookings.filter((booking) => {
          if (booking.status !== 'APPROVED' || booking.date !== form.date) {
            return false;
          }

          return booking.startTime < form.endTime && booking.endTime > form.startTime;
        });

        setConflicts(overlapping);
      } catch {
        setConflicts([]);
      } finally {
        setIsCheckingConflicts(false);
      }
    };

    findConflicts();
  }, [form.resourceId, form.date, form.startTime, form.endTime]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError('');
    }

    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      if (form.startTime >= form.endTime) {
        setError('Start time must be earlier than end time. Please choose a valid time range.');
        setIsSubmitting(false);
        return;
      }

      await createBookingRequest({
        resourceId: form.resourceId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose,
        expectedAttendees: form.expectedAttendees ? Number(form.expectedAttendees) : undefined,
      });

      setSuccessMessage('Booking request submitted successfully. You can track it from My Bookings.');
      setForm(initialForm);
    } catch (submitError) {
      const message = submitError.message || 'Unable to submit booking request.';
      if (message.toLowerCase().includes('conflict')) {
        setError('This slot is already booked. Please select a different time range.');
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="booking-page">
      <header className="booking-head">
        <div>
          <p className="home-kicker">Booking Management</p>
          <h1>Request a Resource Booking</h1>
          <p className="booking-copy">Select an active resource and submit your preferred date and time slot.</p>
        </div>
        <div className="booking-head-actions">
          <Link to="/my-bookings" className="ghost-btn booking-nav-link">
            View My Bookings
          </Link>
          <Link to="/home" className="ghost-btn booking-nav-link">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <section className="booking-panel">
        <form className="booking-form" onSubmit={handleSubmit}>
          <label htmlFor="resourceId">Resource</label>
          <select
            id="resourceId"
            name="resourceId"
            value={form.resourceId}
            onChange={handleChange}
            disabled={isLoadingResources}
            required
          >
            <option value="">Select a resource</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name} ({resource.location})
              </option>
            ))}
          </select>

          <div className="booking-form-grid">
            <div>
              <label htmlFor="date">Date</label>
              <input id="date" type="date" name="date" value={form.date} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="startTime">Start Time</label>
              <input
                id="startTime"
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="endTime">End Time</label>
              <input id="endTime" type="time" name="endTime" value={form.endTime} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="expectedAttendees">Expected Attendees</label>
              <input
                id="expectedAttendees"
                type="number"
                name="expectedAttendees"
                min="1"
                value={form.expectedAttendees}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
          </div>

          <label htmlFor="purpose">Purpose</label>
          <textarea
            id="purpose"
            name="purpose"
            rows="4"
            value={form.purpose}
            onChange={handleChange}
            placeholder="Describe the activity or event"
            required
          />

          {selectedResource ? (
            <p className="booking-hint">
              Resource capacity: <strong>{selectedResource.capacity}</strong> | Status: <strong>{selectedResource.status}</strong>
            </p>
          ) : null}

          {isCheckingConflicts ? <p className="booking-hint">Checking slot availability...</p> : null}

          {!isCheckingConflicts && conflicts.length > 0 ? (
            <div className="booking-conflict-box" role="alert">
              <p className="field-error">Selected slot overlaps with approved bookings.</p>
              <ul>
                {conflicts.map((conflict) => (
                  <li key={conflict.id}>
                    {conflict.startTime} - {conflict.endTime} ({conflict.purpose})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {error ? <p className="field-error">{error}</p> : null}
          {successMessage ? <p className="form-success">{successMessage}</p> : null}

          <button
            type="submit"
            className="primary-btn"
            disabled={isSubmitting || isLoadingResources || conflicts.length > 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default BookingRequestPage;
