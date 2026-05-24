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

  useEffect(() => {
    if (existingEvent) {
      setFormData({
        title: existingEvent.title,
        startTime: new Date(existingEvent.start).toISOString().slice(0, 16),
        endTime: new Date(existingEvent.end).toISOString().slice(0, 16),
        description: existingEvent.description || '',
      });
    } else if (selectedDate) {
      const start = new Date(selectedDate);
      start.setHours(9, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(10, 0, 0, 0);

      setFormData({
        title: '',
        startTime: start.toISOString().slice(0, 16),
        endTime: end.toISOString().slice(0, 16),
        description: '',
      });
    }
  }, [existingEvent, selectedDate, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (existingEvent) {
        const dbId = existingEvent.id.replace('personal-', '');
        await updatePersonalEvent(dbId, formData);
      } else {
        await createPersonalEvent(formData);
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
          <button onClick={onClose} className="modal-close-btn">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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
              className="form-input"
              style={{ minHeight: '100px', resize: 'vertical', paddingTop: '0.75rem' }}
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
