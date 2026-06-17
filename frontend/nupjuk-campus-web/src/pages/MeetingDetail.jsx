import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, CalendarDays, Clock, Users } from 'lucide-react';
import { finalizeMeeting, getMeetingDetail, saveMeetingAvailability } from '../api/courses';
import { connectMeetingRealtime } from '../api/realtime';
import '../styles/CourseDetail.css';

const SLOT_MINUTES = 30;

function toDateKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function formatDate(dateKey) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(timeString) {
  const [hour, minute] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function minutesFromTime(timeString) {
  const [hour, minute] = timeString.split(':').map(Number);
  return hour * 60 + minute;
}

function timeFromMinutes(totalMinutes) {
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minute = String(totalMinutes % 60).padStart(2, '0');
  return `${hour}:${minute}`;
}

function getDateKeys(start, end) {
  const dates = [];
  const cursor = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  while (cursor <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function getTimeSlots(start, end) {
  const times = [];
  const endMinutes = minutesFromTime(end);

  for (let minutes = minutesFromTime(start); minutes < endMinutes; minutes += SLOT_MINUTES) {
    times.push(timeFromMinutes(minutes));
  }

  return times;
}

function getSlotIso(dateKey, timeString) {
  return new Date(`${dateKey}T${timeString}:00`).toISOString();
}

function addMinutes(value, minutes) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function getCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export default function MeetingDetail() {
  const { courseId, meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [finalSlot, setFinalSlot] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const dragState = useRef({ active: false, mode: 'add', slots: new Set() });
  const currentUserId = getCurrentUserId();

  const loadMeeting = async ({ preserveSelection = false } = {}) => {
    try {
      if (!preserveSelection) {
        setIsLoading(true);
      }
      setError('');
      const data = await getMeetingDetail(meetingId);
      setMeeting(data);
      if (!preserveSelection) {
        setSelectedSlots(new Set(data.my_available_slots));
        setFinalSlot(data.finalized_start_time || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to load meeting.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeeting();
  }, [meetingId]);

  useEffect(() => {
    return connectMeetingRealtime(meetingId, () => {
      loadMeeting({ preserveSelection: true });
    });
  }, [meetingId]);

  useEffect(() => {
    const finishDrag = () => {
      dragState.current.active = false;
      dragState.current.slots.clear();
    };

    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);

    return () => {
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
    };
  }, []);

  const dateKeys = useMemo(() => {
    if (!meeting) return [];
    return getDateKeys(toDateKey(meeting.date_range_start), toDateKey(meeting.date_range_end));
  }, [meeting]);

  const timeSlots = useMemo(() => {
    if (!meeting) return [];
    return getTimeSlots(meeting.time_range_start, meeting.time_range_end);
  }, [meeting]);

  const slotCounts = useMemo(() => {
    const counts = new Map();

    meeting?.availabilities.forEach((availability) => {
      availability.available_slots.forEach((slot) => {
        const key = new Date(slot).toISOString();
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });

    return counts;
  }, [meeting]);

  const maxSlotCount = useMemo(() => {
    return Math.max(1, ...Array.from(slotCounts.values()));
  }, [slotCounts]);

  const slotOptions = useMemo(() => {
    return dateKeys.flatMap((dateKey) =>
      timeSlots.map((time) => {
        const value = getSlotIso(dateKey, time);
        return {
          value,
          label: `${formatDate(dateKey)} ${formatTime(time)} - ${formatTime(
            timeFromMinutes(minutesFromTime(time) + SLOT_MINUTES)
          )}`,
        };
      })
    );
  }, [dateKeys, timeSlots]);

  const dateRangeLabel =
    dateKeys.length > 0
      ? `${formatDate(dateKeys[0])} - ${formatDate(dateKeys[dateKeys.length - 1])}`
      : 'Date not set';

  const isFinalized = meeting?.status === 'finalized';
  const isCreator = currentUserId && Number(currentUserId) === Number(meeting?.creator_id);
  const finalizedLabel =
    meeting?.finalized_start_time && meeting?.finalized_end_time
      ? `${formatDate(toDateKey(meeting.finalized_start_time))} ${formatTime(
          new Date(meeting.finalized_start_time).toTimeString().slice(0, 5)
        )} - ${formatTime(new Date(meeting.finalized_end_time).toTimeString().slice(0, 5))}`
      : '';

  const applySlot = (slot, mode) => {
    setSaveMessage('');
    setSelectedSlots((current) => {
      const next = new Set(current);

      if (mode === 'remove') {
        next.delete(slot);
      } else {
        next.add(slot);
      }
      return next;
    });
  };

  const handleSlotPointerDown = (event, slot, isSelected) => {
    event.preventDefault();
    const mode = isSelected ? 'remove' : 'add';
    dragState.current = { active: true, mode, slots: new Set([slot]) };
    applySlot(slot, mode);
  };

  const handleSlotPointerEnter = (slot) => {
    if (!dragState.current.active || dragState.current.slots.has(slot)) return;

    dragState.current.slots.add(slot);
    applySlot(slot, dragState.current.mode);
  };

  const handleGridPointerMove = (event) => {
    if (!dragState.current.active) return;

    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-slot]');
    const slot = target?.getAttribute('data-slot');
    if (slot) {
      handleSlotPointerEnter(slot);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSaveMessage('');
      await saveMeetingAvailability(meetingId, Array.from(selectedSlots));
      const updated = await getMeetingDetail(meetingId);
      setMeeting(updated);
      setSelectedSlots(new Set(updated.my_available_slots));
      setSaveMessage('Saved.');
    } catch (err) {
      setError(err.message || 'Failed to save availability.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!finalSlot) {
      setError('Choose a final time.');
      return;
    }

    try {
      setIsFinalizing(true);
      setError('');
      setSaveMessage('');
      await finalizeMeeting(meetingId, finalSlot, addMinutes(finalSlot, SLOT_MINUTES));
      const updated = await getMeetingDetail(meetingId);
      setMeeting(updated);
      setFinalSlot(updated.finalized_start_time || finalSlot);
      setSaveMessage('Meeting finalized and added to calendars.');
    } catch (err) {
      setError(err.message || 'Failed to finalize meeting.');
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoading) return <div className="meeting-detail-container">Loading meeting...</div>;
  if (error && !meeting) return <div className="meeting-detail-container">{error}</div>;
  if (!meeting) return <div className="meeting-detail-container">Meeting not found.</div>;

  return (
    <div className="meeting-detail-container">
      <button
        type="button"
        onClick={() => navigate(`/courses/${courseId}`, { state: { activeTab: 'meetings' } })}
        className="back-button meeting-back-button"
      >
        <ArrowLeft size={20} /> Back to Course
      </button>

      <header className="meeting-detail-header">
        <div>
          <h1>{meeting.title}</h1>
          <p>{meeting.description || 'No description.'}</p>
        </div>
        <div className="meeting-detail-meta">
          <span>
            <CalendarDays size={15} /> {dateRangeLabel}
          </span>
          <span>
            <Clock size={15} /> {formatTime(meeting.time_range_start)} -{' '}
            {formatTime(meeting.time_range_end)}
          </span>
          <span>
            <Users size={15} /> {meeting.participant_count} participants
          </span>
          {isFinalized && (
            <span className="meeting-finalized-meta">
              <CalendarCheck size={15} /> {finalizedLabel}
            </span>
          )}
        </div>
      </header>

      <section className="meeting-detail-panel">
        <div className="meeting-section-header">
          <div>
            <h2>My availability</h2>
            <span>{meeting.availabilities.length} responses</span>
          </div>
          <button
            type="button"
            className="meeting-primary-button"
            onClick={handleSave}
            disabled={isSaving || isFinalized}
          >
            {isSaving ? 'Saving...' : isFinalized ? 'Finalized' : 'Save availability'}
          </button>
        </div>

        {error && <p className="meeting-form-error">{error}</p>}
        {saveMessage && <p className="meeting-save-message">{saveMessage}</p>}

        {(isCreator || isFinalized) && (
          <div className="meeting-finalize-panel">
            <div>
              <h3>Final time</h3>
              <p>{isFinalized ? finalizedLabel : 'Choose the meeting time to add to calendars.'}</p>
            </div>
            {!isFinalized && (
              <div className="meeting-finalize-controls">
                <select value={finalSlot} onChange={(event) => setFinalSlot(event.target.value)}>
                  <option value="">Select time</option>
                  {slotOptions.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="meeting-primary-button"
                  onClick={handleFinalize}
                  disabled={isFinalizing}
                >
                  {isFinalizing ? 'Finalizing...' : 'Finalize meeting'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="meeting-grid-scroll">
          <div
            className="meeting-availability-grid"
            onPointerMove={handleGridPointerMove}
            style={{ gridTemplateColumns: `84px repeat(${dateKeys.length}, minmax(92px, 1fr))` }}
          >
            <div className="meeting-grid-corner" />
            {dateKeys.map((dateKey) => (
              <div key={dateKey} className="meeting-grid-day">
                {formatDate(dateKey)}
              </div>
            ))}

            {timeSlots.map((time) => (
              <div key={time} className="meeting-grid-row">
                <div className="meeting-grid-time">{formatTime(time)}</div>
                {dateKeys.map((dateKey) => {
                  const slot = getSlotIso(dateKey, time);
                  const isSelected = selectedSlots.has(slot);
                  const count = slotCounts.get(slot) || 0;
                  const heat = count / maxSlotCount;

                  return (
                    <button
                      key={slot}
                      type="button"
                      data-slot={slot}
                      className={`meeting-slot${isSelected ? ' selected' : ''}`}
                      onPointerDown={(event) => handleSlotPointerDown(event, slot, isSelected)}
                      onPointerEnter={() => handleSlotPointerEnter(slot)}
                      style={{ '--slot-heat': heat }}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
