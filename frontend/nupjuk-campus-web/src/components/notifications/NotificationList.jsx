import NotificationListItem from './NotificationListItem';

export default function NotificationList({ notifications, isLoading, error, onMarkAsRead }) {
  if (isLoading) {
    return <p className="empty-state">Loading alerts...</p>;
  }

  if (error) {
    return <p className="empty-state">{error}</p>;
  }

  if (notifications.length === 0) {
    return <p className="empty-state">No alerts to show.</p>;
  }

  return (
    <div className="notification-list">
      {notifications.map((notification) => (
        <NotificationListItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </div>
  );
}
