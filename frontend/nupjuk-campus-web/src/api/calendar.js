import { apiRequest } from './http';

export async function getCalendarFeed() {
  // Fetches assignments and personal events merged and sorted
  return await apiRequest('/calendar/feed');
}

export async function createPersonalEvent(eventData) {
  return await apiRequest('/personal-events', {
    method: 'POST',
    body: eventData, // Expects { title, startTime, endTime, description, status }
  });
}

export async function updatePersonalEvent(eventId, eventData) {
  return await apiRequest(`/personal-events/${eventId}`, {
    method: 'PATCH',
    body: eventData,
  });
}

export async function deletePersonalEvent(eventId) {
  return await apiRequest(`/personal-events/${eventId}`, {
    method: 'DELETE',
  });
}
