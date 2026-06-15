import { useEffect, useState } from 'react';
import { CheckCheck, SlidersHorizontal } from 'lucide-react';
import NotificationList from '../components/notifications/NotificationList';
import NotificationPreferencesPanel from '../components/notifications/NotificationPreferencesPanel';
import {
  getNotifications,
  getNotificationPreferences,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  updateNotificationPreferences,
} from '../api/notifications';
import '../styles/Alerts.css';

const NOTIFICATION_LIMIT = 30;

export default function Alerts() {
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [activePanel, setActivePanel] = useState('notifications');
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [savingPreferenceId, setSavingPreferenceId] = useState('');
  const [error, setError] = useState('');
  const [preferencesError, setPreferencesError] = useState('');

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setIsLoading(true);
        setError('');
        setPreferencesError('');

        const [notificationData, preferenceData] = await Promise.all([
          getNotifications({ limit: NOTIFICATION_LIMIT, unreadOnly: showUnreadOnly }),
          getNotificationPreferences(),
        ]);

        setNotifications(notificationData.data);
        if (notificationData.meta) {
          setUnreadCount(notificationData.meta.unreadCount);
          setPaginationMeta(notificationData.meta);
        }

        setPreferences(preferenceData);
      } catch (err) {
        setError(err.message || 'Failed to load alerts.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAlerts();
  }, [showUnreadOnly]);

  const handleNotificationRead = async (notificationId) => {
    const target = notifications.find((notification) => notification.id === notificationId);
    if (!target || target.is_read) return;

    const previousNotifications = notifications;

    setNotifications((current) =>
      showUnreadOnly
        ? current.filter((notification) => notification.id !== notificationId)
        : current.map((notification) =>
            notification.id === notificationId ? { ...notification, is_read: true } : notification
          )
    );

    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(target.raw_id);
      window.dispatchEvent(new Event('notifications:updated'));
    } catch (err) {
      setNotifications(previousNotifications);
      setUnreadCount((prev) => prev + 1);
      setError(err.message || 'Failed to mark notification as read.');
    }
  };

  const handleMarkAllAsRead = async () => {
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    try {
      setIsMarkingAll(true);
      setError('');

      setNotifications((current) =>
        current.map((notification) => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);

      await markAllNotificationsAsRead();
      window.dispatchEvent(new Event('notifications:updated'));

      if (showUnreadOnly) {
        setNotifications([]);
      }
    } catch (err) {
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      setError(err.message || 'Failed to mark notifications as read.');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handlePreferenceChange = async (preferenceId, changes) => {
    const currentPreference = preferences.find((preference) => preference.id === preferenceId);
    if (!currentPreference) return;

    const updatedPreference = { ...currentPreference, ...changes };

    setPreferencesError('');
    setSavingPreferenceId(preferenceId);
    setPreferences((current) =>
      current.map((preference) => (preference.id === preferenceId ? updatedPreference : preference))
    );

    try {
      const response = await updateNotificationPreferences(updatedPreference);
      if (response.preferences) {
        setPreferences((current) =>
          current.map((preference) =>
            preference.id === preferenceId ? response.preferences : preference
          )
        );
      }
    } catch (err) {
      setPreferences((current) =>
        current.map((preference) =>
          preference.id === preferenceId ? currentPreference : preference
        )
      );
      setPreferencesError(err.message || 'Failed to update preferences.');
    } finally {
      setSavingPreferenceId('');
    }
  };

  const handleCreateDefaultPreference = async () => {
    const temporaryPreference = {
      id: 'new-global-preference',
      course_id: null,
      post_comment_enabled: true,
      deadline_enabled: true,
      meeting_enabled: true,
      email_enabled: false,
      deadline_reminder_timing: ['24h', '3h'],
      course: null,
    };

    setPreferencesError('');
    setSavingPreferenceId(temporaryPreference.id);

    setPreferences((current) => [...current, temporaryPreference]);

    try {
      const response = await updateNotificationPreferences(temporaryPreference);
      if (response.preferences) {
        setPreferences((current) =>
          current.map((p) => (p.id === temporaryPreference.id ? response.preferences : p))
        );
      }
    } catch (err) {
      setPreferences((current) => current.filter((p) => p.id !== temporaryPreference.id));
      setPreferencesError(err.message || 'Failed to create preferences.');
    } finally {
      setSavingPreferenceId('');
    }
  };

  return (
    <div className="alerts-container">
      <header className="alerts-header">
        <div>
          <h1>Alerts</h1>
          <p className="page-header-subtitle">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'All caught up'}
          </p>
        </div>

        <button
          type="button"
          className="alerts-action-button"
          onClick={() =>
            setActivePanel((current) =>
              current === 'preferences' ? 'notifications' : 'preferences'
            )
          }
          aria-expanded={activePanel === 'preferences'}
        >
          <SlidersHorizontal size={18} />
          Preferences
        </button>
      </header>

      <div className="alerts-toolbar">
        <label className="alerts-toggle">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(event) => setShowUnreadOnly(event.target.checked)}
          />
          <span>Show Unread only</span>
        </label>

        <button
          type="button"
          className="alerts-action-button"
          onClick={handleMarkAllAsRead}
          disabled={isMarkingAll || unreadCount === 0}
        >
          <CheckCheck size={18} />
          Mark all read
        </button>
      </div>

      <div className={`alerts-layout ${activePanel === 'preferences' ? 'has-preferences' : ''}`}>
        <section className="alerts-main-panel">
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            error={error}
            onMarkAsRead={handleNotificationRead}
          />
        </section>

        <aside
          className={`alerts-preferences-column ${activePanel === 'preferences' ? 'is-open' : ''}`}
        >
          <NotificationPreferencesPanel
            preferences={preferences}
            error={preferencesError}
            savingPreferenceId={savingPreferenceId}
            onPreferenceChange={handlePreferenceChange}
            onCreateDefaultPreference={handleCreateDefaultPreference}
          />
        </aside>
      </div>
    </div>
  );
}
