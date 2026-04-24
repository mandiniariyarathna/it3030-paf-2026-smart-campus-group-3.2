import { useEffect, useMemo, useState } from 'react';
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/notificationService';

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const hasNotifications = useMemo(() => notifications.length > 0, [notifications]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getNotifications(0, 12);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      setError('Unable to load notifications right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      await loadNotifications();
    } catch {
      setError('Could not update notification.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch {
      setError('Could not mark all as read.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      await loadNotifications();
    } catch {
      setError('Could not delete notification.');
    }
  };

  return (
    <div className="notification-wrapper">
      <button
        type="button"
        className="notification-bell"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
      >
        Notifications
        {unreadCount > 0 ? <span className="notification-count">{unreadCount}</span> : null}
      </button>

      {isOpen ? (
        <section className="notification-panel" aria-label="notification panel">
          <header>
            <h3>Notifications</h3>
            <button type="button" onClick={handleMarkAllRead} disabled={!hasNotifications}>
              Mark all read
            </button>
          </header>

          {isLoading ? <p className="panel-empty">Loading notifications...</p> : null}
          {error ? <p className="field-error">{error}</p> : null}

          {!isLoading && !hasNotifications ? <p className="panel-empty">No notifications yet.</p> : null}

          <ul>
            {notifications.map((item) => (
              <li key={item.id} className={item.isRead ? 'read' : 'unread'}>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.message}</p>
                </div>
                <div className="notification-actions">
                  {!item.isRead ? (
                    <button type="button" onClick={() => handleMarkRead(item.id)}>
                      Read
                    </button>
                  ) : null}
                  <button type="button" onClick={() => handleDelete(item.id)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default NotificationBell;
