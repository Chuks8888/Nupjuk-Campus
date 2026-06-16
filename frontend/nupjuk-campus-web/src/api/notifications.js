import { apiRequest } from './http';

function normalizeNotification(notification) {
  return {
    id: String(notification.id),
    raw_id: notification.id,
    user_id: notification.userId ?? notification.user_id,
    type: notification.type,
    content: notification.content,
    delivery_channel: notification.deliveryChannel ?? notification.delivery_channel,
    target_type: notification.targetType ?? notification.target_type ?? null,
    target_id: notification.targetId ?? notification.target_id ?? null,
    target_url: notification.targetUrl ?? notification.target_url ?? null,
    is_read: notification.isRead ?? notification.is_read,
    created_at: notification.createdAt ?? notification.created_at,
  };
}

function normalizePreference(preference) {
  return {
    id: String(preference.id),
    raw_id: preference.id,
    user_id: preference.userId ?? preference.user_id,
    course_id: preference.courseId ?? preference.course_id ?? null,
    post_comment_enabled: preference.postCommentEnabled ?? preference.post_comment_enabled,
    deadline_enabled: preference.deadlineEnabled ?? preference.deadline_enabled,
    meeting_enabled: preference.meetingEnabled ?? preference.meeting_enabled,
    email_enabled: preference.emailEnabled ?? preference.email_enabled,
    deadline_reminder_timing:
      preference.deadlineReminderTiming ?? preference.deadline_reminder_timing ?? [],
    course: preference.course
      ? {
          course_code: preference.course.courseCode ?? preference.course.course_code,
          course_name: preference.course.courseName ?? preference.course.course_name,
        }
      : null,
  };
}

function buildNotificationQuery({ page, limit, unreadOnly } = {}) {
  const params = new URLSearchParams();

  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);
  if (unreadOnly !== undefined) params.set('unreadOnly', String(unreadOnly));

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getNotifications(options = {}) {
  const response = await apiRequest(`/notifications${buildNotificationQuery(options)}`);
  const notifications = Array.isArray(response) ? response : response.data || [];

  return {
    data: notifications.map(normalizeNotification),
    meta: response.meta || null,
  };
}

export async function markNotificationAsRead(notificationId) {
  const response = await apiRequest(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });

  return {
    message: response.message,
    notification: response.notification ? normalizeNotification(response.notification) : null,
  };
}

export async function markAllNotificationsAsRead() {
  return await apiRequest('/notifications/read-all', {
    method: 'PATCH',
  });
}

export async function getNotificationPreferences() {
  const preferences = await apiRequest('/notifications/preferences');
  return preferences.map(normalizePreference);
}

export async function updateNotificationPreferences(preferences) {
  const response = await apiRequest('/notifications/preferences', {
    method: 'PUT',
    body: {
      courseId: preferences.courseId ?? preferences.course_id,
      postCommentEnabled: preferences.postCommentEnabled ?? preferences.post_comment_enabled,
      deadlineEnabled: preferences.deadlineEnabled ?? preferences.deadline_enabled,
      meetingEnabled: preferences.meetingEnabled ?? preferences.meeting_enabled,
      emailEnabled: preferences.emailEnabled ?? preferences.email_enabled,
      deadlineReminderTiming:
        preferences.deadlineReminderTiming ?? preferences.deadline_reminder_timing,
    },
  });

  return {
    message: response.message,
    preferences: response.preferences ? normalizePreference(response.preferences) : null,
  };
}
