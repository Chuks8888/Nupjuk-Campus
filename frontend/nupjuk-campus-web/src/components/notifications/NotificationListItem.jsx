import { useNavigate } from 'react-router-dom';
import { Bell, Check, ExternalLink, MessageSquare, CalendarClock, Clock } from 'lucide-react';

const TYPE_ICONS = {
  post_comment: MessageSquare,
  NEW_COMMENT: MessageSquare,
  deadline: Clock,
  meeting: CalendarClock,
};

const APP_ROUTE_PATTERNS = [
  /^\/home\/?$/,
  /^\/courses\/?$/,
  /^\/courses\/[^/]+\/?$/,
  /^\/courses\/[^/]+\/posts\/[^/]+\/?$/,
  /^\/courses\/[^/]+\/posts\/new\/?$/,
  /^\/courses\/[^/]+\/posts\/[^/]+\/edit\/?$/,
  /^\/calendar\/?$/,
  /^\/alerts\/?$/,
];

function formatNotificationDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTypeLabel(type) {
  if (!type) return 'Notification';
  return type
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function resolveTargetPath(notification) {
  if (!notification.target_url) return '';

  try {
    const url = new URL(notification.target_url, window.location.origin);
    const normalizedPostPath = url.pathname.match(
      /^\/courses\/([^/]+)\/posts\/([^/]+)(?:\/.*)?$/
    );
    const pathname = normalizedPostPath
      ? `/courses/${normalizedPostPath[1]}/posts/${normalizedPostPath[2]}`
      : url.pathname;
    const path = `${pathname}${url.search}${url.hash}`;

    if (APP_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname))) {
      return path;
    }
  } catch (error) {
    return '';
  }

  return '';
}

export default function NotificationListItem({ notification, onMarkAsRead }) {
  const navigate = useNavigate();
  const Icon = TYPE_ICONS[notification.type] || Bell;
  const createdAt = formatNotificationDate(notification.created_at);
  const targetPath = resolveTargetPath(notification);
  const hasTarget = Boolean(targetPath);

  const handleOpenTarget = async () => {
    await onMarkAsRead(notification.id);

    if (targetPath) {
      navigate(targetPath);
    }
  };

  return (
    <article className={`notification-item ${notification.is_read ? 'is-read' : 'is-unread'}`}>
      <div className="notification-icon">
        <Icon size={22} />
      </div>

      <div className="notification-content">
        <div className="notification-meta">
          <span className="notification-type">{getTypeLabel(notification.type)}</span>
          {createdAt && <span>{createdAt}</span>}
        </div>
        <p>{notification.content}</p>
      </div>

      <div className="notification-actions">
        {!notification.is_read && (
          <button
            type="button"
            className="alerts-icon-button"
            onClick={() => onMarkAsRead(notification.id)}
            aria-label="Mark as read"
            title="Mark as read"
          >
            <Check size={18} />
          </button>
        )}
        {hasTarget && (
          <button
            type="button"
            className="alerts-icon-button"
            onClick={handleOpenTarget}
            aria-label="Open alert target"
            title="Open alert target"
          >
            <ExternalLink size={18} />
          </button>
        )}
      </div>
    </article>
  );
}
