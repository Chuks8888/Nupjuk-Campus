import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { createPersonalEvent, updatePersonalEvent, deletePersonalEvent } from '../../api/calendar';

export default function PersonalEventModal({
  isOpen,
  onClose,
  selectedDate,
  existingEvent,
  onEventSaved,
}) {
  const [formData, setFormData] = useState({
    title: '',
    startTime: new Date(),
    endTime: new Date(),
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingEvent) {
      setFormData({
        title: existingEvent.title,
        startTime: new Date(existingEvent.start),
        endTime: new Date(existingEvent.end || existingEvent.start),
        description: existingEvent.description || '',
      });
    } else if (selectedDate) {
      const start = new Date(selectedDate);
      start.setHours(9, 0, 0, 0);

      const end = new Date(selectedDate);
      end.setHours(10, 0, 0, 0);

      setFormData({
        title: '',
        startTime: start,
        endTime: end,
        description: '',
      });
    }
  }, [existingEvent, selectedDate, isOpen]);

  if (!isOpen) return null;

  const handleTextChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleStartTimeChange = (date) => {
    setFormData((prev) => {
      const newData = { ...prev, startTime: date };

      if (newData.endTime && date >= newData.endTime) {
        const newEnd = new Date(date);
        newEnd.setHours(newEnd.getHours() + 1);
        newData.endTime = newEnd;
      }
      return newData;
    });
  };

  const handleEndTimeChange = (date) => {
    setFormData((prev) => ({ ...prev, endTime: date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      startTime: formData.startTime.toISOString(),
      endTime: formData.endTime.toISOString(),
    };

    try {
      if (existingEvent) {
        const dbId = existingEvent.id.replace('personal-', '');
        await updatePersonalEvent(dbId, payload);
      } else {
        await createPersonalEvent(payload);
      }
      onEventSaved();
      onClose();
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('Failed to save event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      const dbId = existingEvent.id.replace('personal-', '');
      await deletePersonalEvent(dbId);
      onEventSaved();
      onClose();
    } catch (error) {
      console.error('Failed to delete', error);
      alert('Failed to delete event.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{existingEvent ? 'Edit Event' : 'New Personal Event'}</h2>
          <button onClick={onClose} className="icon-button">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Title</label>
            <input
              name="title"
              required
              value={formData.title}
              onChange={handleTextChange}
              className="form-input"
              autoComplete="off"
            />
          </div>

          <div className="form-row">
            <div className="form-group date-picker-wrapper">
              <label>Start Time</label>
              <DatePicker
                selected={formData.startTime}
                onChange={handleStartTimeChange}
                showTimeSelect
                timeFormat="h:mm aa"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                className="form-input"
                wrapperClassName="date-picker-full-width"
              />
            </div>
            <div className="form-group date-picker-wrapper">
              <label>End Time</label>
              <DatePicker
                selected={formData.endTime}
                onChange={handleEndTimeChange}
                showTimeSelect
                timeFormat="h:mm aa"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                className="form-input"
                wrapperClassName="date-picker-full-width"
                minDate={formData.startTime}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleTextChange}
              className="form-input textarea-input"
            />
          </div>

          <div className="modal-actions">
            {existingEvent && (
              <button type="button" onClick={handleDelete} className="btn-danger">
                <Trash2 size={16} /> Delete
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
