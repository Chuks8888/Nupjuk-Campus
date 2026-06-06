import { API_BASE_URL, getAuthToken } from './http';

function getRealtimeUrl() {
  const baseUrl = new URL(API_BASE_URL);
  baseUrl.protocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  baseUrl.pathname = '/realtime';
  baseUrl.searchParams.set('token', getAuthToken() || '');
  return baseUrl.toString();
}

export function connectMeetingRealtime(meetingId, onUpdate) {
  const socket = new WebSocket(getRealtimeUrl());

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'join_meeting', meetingId }));
  });

  socket.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'meeting_updated' && String(message.meetingId) === String(meetingId)) {
        onUpdate();
      }
    } catch {
      return;
    }
  });

  return () => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'leave_meeting', meetingId }));
    }
    socket.close();
  };
}
