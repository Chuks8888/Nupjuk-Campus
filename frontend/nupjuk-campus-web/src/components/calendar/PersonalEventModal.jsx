import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
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
    startTime: '',
    endTime: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toLocalDatetimeString = (dateObj) => {
    if (!dateObj) return '';
    const d = new Date(dateObj);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (existingEvent) {
      setFormData({
        title: existingEvent.title,
        startTime: toLocalDatetimeString(existingEvent.start),
        endTime: toLocalDatetimeString(existingEvent.end),
        description: existingEvent.description || '',
      });
    } else if (selectedDate) {
      const start = new Date(selectedDate);
      start.setHours(9, 0, 0, 0);

      const end = new Date(selectedDate);
      end.setHours(10, 0, 0, 0);

      setFormData({
        title: '',
        startTime: toLocalDatetimeString(start),
        endTime: toLocalDatetimeString(end),
        description: '',
      });
    }
  }, [existingEvent, selectedDate, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      if (name === 'startTime' && newData.endTime) {
        const newStart = new Date(value);
        const currentEnd = new Date(newData.endTime);

        if (newStart >= currentEnd) {
          newStart.setHours(newStart.getHours() + 1);
          newData.endTime = toLocalDatetimeString(newStart);
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
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
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="datetime-local"
                name="startTime"
                required
                value={formData.startTime}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input
                type="datetime-local"
                name="endTime"
                required
                value={formData.endTime}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
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
