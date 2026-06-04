import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Plus, Users } from 'lucide-react';
import DetailCard from '../common/DetailCard';

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateRange(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Date not set';
  }

  const options = { month: 'short', day: 'numeric' };
  const formattedStart = startDate.toLocaleDateString('en-US', options);
  const formattedEnd = endDate.toLocaleDateString('en-US', options);

  return formattedStart === formattedEnd ? formattedStart : `${formattedStart} - ${formattedEnd}`;
}

function formatTime(timeString) {
  if (!timeString) return 'Time not set';

  const [hour, minute] = timeString.split(':');
  if (hour === undefined || minute === undefined) return timeString;

  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CourseMeetings({ courseId, meetings, onCreateMeeting }) {
  const navigate = useNavigate();
  const today = getTodayDate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dateRangeStart: today,
    dateRangeEnd: today,
    timeRangeStart: '09:00',
    timeRangeEnd: '10:00',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
      ...(field === 'dateRangeStart' && current.dateRangeEnd < value
        ? { dateRangeEnd: value }
        : {}),
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dateRangeStart: today,
      dateRangeEnd: today,
      timeRangeStart: '09:00',
      timeRangeEnd: '10:00',
    });
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Title is required.');
      return;
    }

    if (formData.dateRangeEnd < formData.dateRangeStart) {
      setFormError('End date must be after the start date.');
      return;
    }

    if (formData.timeRangeEnd <= formData.timeRangeStart) {
      setFormError('End time must be after the start time.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateMeeting({
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
      });
      resetForm();
      setShowForm(false);
    } catch (error) {
      setFormError(error.message || 'Failed to create meeting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="course-meetings">
      <div className="meetings-header">
        {!showForm && (
          <button type="button" className="meeting-create-button" onClick={() => setShowForm(true)}>
            <Plus size={16} /> New Meeting
          </button>
        )}
      </div>

      {showForm && (
        <form className="meeting-form" onSubmit={handleSubmit}>
          <div className="meeting-form-grid">
            <label className="meeting-form-field meeting-form-title">
              <span>Title</span>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Study group, project sync..."
                maxLength={80}
                required
              />
            </label>

            <label className="meeting-form-field">
              <span>Start date</span>
              <input
                type="date"
                value={formData.dateRangeStart}
                onChange={(event) => updateField('dateRangeStart', event.target.value)}
                required
              />
            </label>

            <label className="meeting-form-field">
              <span>End date</span>
              <input
                type="date"
                value={formData.dateRangeEnd}
                min={formData.dateRangeStart}
                onChange={(event) => updateField('dateRangeEnd', event.target.value)}
                required
              />
            </label>

            <label className="meeting-form-field">
              <span>Start time</span>
              <input
                type="time"
                value={formData.timeRangeStart}
                onChange={(event) => updateField('timeRangeStart', event.target.value)}
                required
              />
            </label>

            <label className="meeting-form-field">
              <span>End time</span>
              <input
                type="time"
                value={formData.timeRangeEnd}
                onChange={(event) => updateField('timeRangeEnd', event.target.value)}
                required
              />
            </label>

            <label className="meeting-form-field meeting-form-description">
              <span>Description</span>
              <textarea
                value={formData.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Optional details"
                rows={2}
              />
            </label>
          </div>

          {formError && <p className="meeting-form-error">{formError}</p>}

          <div className="meeting-form-actions">
            <button
              type="button"
              className="meeting-secondary-button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="meeting-primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {!meetings || meetings.length === 0 ? (
        <p className="empty-state">No meetings yet.</p>
      ) : (
        <div className="detail-list-container">
          {meetings.map((meeting) => (
            <button
              key={meeting.id}
              type="button"
              className="meeting-card-button"
              onClick={() => navigate(`/courses/${courseId}/meetings/${meeting.id}`)}
            >
              <DetailCard
                category={meeting.status}
                author={meeting.creator_name}
                title={meeting.title}
                description={meeting.description || 'No description.'}
                metaLeft={
                  <>
                    <CalendarDays size={14} />{' '}
                    {formatDateRange(meeting.date_range_start, meeting.date_range_end)}
                    <Clock size={14} /> {formatTime(meeting.time_range_start)} -{' '}
                    {formatTime(meeting.time_range_end)}
                  </>
                }
                metaRight={
                  <>
                    <Users size={14} /> {meeting.participant_count} participants
                  </>
                }
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
