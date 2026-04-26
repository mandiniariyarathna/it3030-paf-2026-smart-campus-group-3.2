import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { createBookingRequest, getBookingById } from '../services/bookingService';
import { getResources } from '../services/resourceService';

const weekdayOptions = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

function parseDate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function getClampedDayInMonth(year, monthIndex, dayOfMonth) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(dayOfMonth, lastDay);
}

function getWeekOffset(start, current) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const currentDateOnly = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const diffDays = Math.floor((currentDateOnly.getTime() - startDateOnly.getTime()) / millisecondsPerDay);
  return Math.floor(diffDays / 7);
}

function generateRecurringDates(rule) {
  const startDate = parseDate(rule.startDate);
  const endDate = parseDate(rule.endDate);

  if (!startDate || !endDate || startDate > endDate) {
    return [];
  }

  const maxOccurrences = Number(rule.maxOccurrences);
  const interval = Math.max(1, Number(rule.interval));
  const dates = [];

  if (rule.frequency === 'DAILY') {
    let cursor = new Date(startDate);

    while (cursor <= endDate && dates.length < maxOccurrences) {
      dates.push(formatDate(cursor));
      cursor = addDays(cursor, interval);
    }

    return dates;
  }

  if (rule.frequency === 'WEEKLY') {
    const selectedDays = rule.weekdays.map(Number);
    if (selectedDays.length === 0) {
      return [];
    }

    let cursor = new Date(startDate);
    while (cursor <= endDate && dates.length < maxOccurrences) {
      const weekOffset = getWeekOffset(startDate, cursor);
      if (weekOffset % interval === 0 && selectedDays.includes(cursor.getDay())) {
        dates.push(formatDate(cursor));
      }
      cursor = addDays(cursor, 1);
    }

    return dates;
  }

  const monthlyDay = Math.min(31, Math.max(1, Number(rule.monthlyDay)));
  let monthCursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (dates.length < maxOccurrences) {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const day = getClampedDayInMonth(year, month, monthlyDay);
    const candidate = new Date(year, month, day);

    if (candidate > endDate) {
      break;
    }

    if (candidate >= startDate) {
      dates.push(formatDate(candidate));
    }

    monthCursor = addMonths(monthCursor, interval);
    if (monthCursor > endDate) {
      break;
    }
  }

  return dates;
}

function RepeatBookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sourceBooking, setSourceBooking] = useState(null);
  const [resourceName, setResourceName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [failedDates, setFailedDates] = useState([]);

  const [rule, setRule] = useState({
    frequency: 'WEEKLY',
    interval: '1',
    startDate: '',
    endDate: '',
    maxOccurrences: '10',
    weekdays: [],
    monthlyDay: '1',
  });

  useEffect(() => {
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      setError('Booking id is required to repeat a booking.');
      setIsLoading(false);
      return;
    }

    const loadSourceBooking = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [booking, resources] = await Promise.all([getBookingById(bookingId), getResources()]);
        setSourceBooking(booking);

        const resource = resources.find((item) => item.id === booking.resourceId);
        setResourceName(resource?.name || booking.resourceId);

        const baseDate = parseDate(booking.date);
        const initialWeekday = baseDate?.getDay();
        const defaultEndDate = addMonths(baseDate || new Date(), 1);

        setRule((previous) => ({
          ...previous,
          startDate: booking.date,
          endDate: formatDate(defaultEndDate),
          weekdays: typeof initialWeekday === 'number' ? [initialWeekday] : [],
          monthlyDay: String((baseDate || new Date()).getDate()),
        }));
      } catch (loadError) {
        setError(loadError.message || 'Unable to load the booking to repeat.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSourceBooking();
  }, [searchParams]);

  const previewDates = useMemo(() => generateRecurringDates(rule).slice(0, 8), [rule]);

  const updateRule = (field, value) => {
    setRule((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (error) {
      setError('');
    }

    if (result) {
      setResult('');
      setFailedDates([]);
    }
  };

  const handleWeekdayToggle = (dayValue) => {
    setRule((previous) => {
      const exists = previous.weekdays.includes(dayValue);
      return {
        ...previous,
        weekdays: exists
          ? previous.weekdays.filter((value) => value !== dayValue)
          : [...previous.weekdays, dayValue].sort((a, b) => a - b),
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!sourceBooking) {
      setError('Source booking details are missing.');
      return;
    }

    if (rule.frequency === 'WEEKLY' && rule.weekdays.length === 0) {
      setError('Select at least one day for weekly recurrence.');
      return;
    }

    const generatedDates = generateRecurringDates(rule);
    if (generatedDates.length === 0) {
      setError('No booking dates were generated. Please adjust recurrence settings.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setResult('');
    setFailedDates([]);

    const failed = [];
    let successCount = 0;

    for (const date of generatedDates) {
      try {
        await createBookingRequest({
          resourceId: sourceBooking.resourceId,
          date,
          startTime: sourceBooking.startTime,
          endTime: sourceBooking.endTime,
          purpose: sourceBooking.purpose,
          expectedAttendees: sourceBooking.expectedAttendees || undefined,
        });
        successCount += 1;
      } catch (submitError) {
        failed.push(`${date}: ${submitError.message || 'Failed to create booking'}`);
      }
    }

    if (successCount === 0) {
      setError('No recurring bookings were created. Review conflicts or selected schedule.');
    } else {
      setResult(`Created ${successCount} recurring booking request(s).`);
    }

    setFailedDates(failed);
    setIsSubmitting(false);
  };

  return (
    <main className="booking-page">
      <header className="booking-head">
        <div>
          <p className="home-kicker">Booking Management</p>
          <h1>Repeat Booking</h1>
          <p className="booking-copy">
            Configure a recurring schedule and create multiple booking requests based on an existing booking.
          </p>
        </div>
        <div className="booking-head-actions">
          <Link to="/my-bookings" className="ghost-btn booking-nav-link">
            Back to My Bookings
          </Link>
          <Link to="/home" className="ghost-btn booking-nav-link">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <section className="booking-panel repeat-panel">
        {isLoading ? <p className="resource-feedback">Loading selected booking...</p> : null}

        {!isLoading && sourceBooking ? (
          <>
            <section className="repeat-source-card" aria-label="source booking summary">
              <h2>Source Booking</h2>
              <p>
                <strong>Resource:</strong> {resourceName}
              </p>
              <p>
                <strong>Time:</strong> {sourceBooking.startTime} - {sourceBooking.endTime}
              </p>
              <p>
                <strong>Purpose:</strong> {sourceBooking.purpose}
              </p>
            </section>

            <form className="booking-form" onSubmit={handleSubmit}>
              <label htmlFor="frequency">Repeat Pattern</label>
              <select
                id="frequency"
                name="frequency"
                value={rule.frequency}
                onChange={(event) => updateRule('frequency', event.target.value)}
                required
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>

              <div className="booking-form-grid repeat-grid">
                <div>
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={rule.startDate}
                    onChange={(event) => updateRule('startDate', event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endDate">End Date</label>
                  <input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={rule.endDate}
                    min={rule.startDate}
                    onChange={(event) => updateRule('endDate', event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="interval">Repeat Every</label>
                  <input
                    id="interval"
                    name="interval"
                    type="number"
                    min="1"
                    max="12"
                    value={rule.interval}
                    onChange={(event) => updateRule('interval', event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="maxOccurrences">Max Requests</label>
                  <input
                    id="maxOccurrences"
                    name="maxOccurrences"
                    type="number"
                    min="1"
                    max="30"
                    value={rule.maxOccurrences}
                    onChange={(event) => updateRule('maxOccurrences', event.target.value)}
                    required
                  />
                </div>
              </div>

              {rule.frequency === 'WEEKLY' ? (
                <div className="repeat-weekdays">
                  <p className="repeat-label">Select Days</p>
                  <div className="repeat-weekdays-list">
                    {weekdayOptions.map((day) => (
                      <label key={day.value} className="repeat-day-option">
                        <input
                          type="checkbox"
                          checked={rule.weekdays.includes(day.value)}
                          onChange={() => handleWeekdayToggle(day.value)}
                        />
                        <span>{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {rule.frequency === 'MONTHLY' ? (
                <div>
                  <label htmlFor="monthlyDay">Day Of Month</label>
                  <input
                    id="monthlyDay"
                    name="monthlyDay"
                    type="number"
                    min="1"
                    max="31"
                    value={rule.monthlyDay}
                    onChange={(event) => updateRule('monthlyDay', event.target.value)}
                    required
                  />
                </div>
              ) : null}

              <div className="repeat-preview" aria-label="recurrence preview">
                <p className="repeat-label">Preview Dates</p>
                {previewDates.length === 0 ? (
                  <p className="booking-hint">No dates to preview with current settings.</p>
                ) : (
                  <ul>
                    {previewDates.map((date) => (
                      <li key={date}>{date}</li>
                    ))}
                  </ul>
                )}
              </div>

              {error ? <p className="field-error">{error}</p> : null}
              {result ? <p className="form-success">{result}</p> : null}
              {failedDates.length > 0 ? (
                <div className="booking-conflict-box" role="alert">
                  <p className="field-error">Some dates could not be created:</p>
                  <ul>
                    {failedDates.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <button type="submit" className="primary-btn" disabled={isSubmitting || isLoading}>
                {isSubmitting ? 'Creating Recurring Requests...' : 'Create Recurring Bookings'}
              </button>
            </form>
          </>
        ) : null}
      </section>
    </main>
  );
}

export default RepeatBookingPage;
