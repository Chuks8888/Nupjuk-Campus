import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getPrefixColor } from '../../utils/colorUtils';
import '../../styles/Cards.css';

export default function AssignmentCard({ assignment, onStatusChange }) {
  const [userStatus, setUserStatus] = useState(assignment.user_completion_status);
  const [remainingTime, setRemainingTime] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const dueDate = new Date(assignment.due_date);
  const formattedDate = dueDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isCompleted = ['completed', 'done'].includes(userStatus);
  const klmsStatus = assignment.klms_submission_status || 'not_submitted';
  const klmsTimingStatus = assignment.klms_timing_status || 'on_time';

  useEffect(() => {
    const updateCountdown = () => {
      if (klmsTimingStatus === 'overdue') {
        setRemainingTime('Overdue');
        return;
      }

      if (klmsTimingStatus === 'late_submitted') {
        setRemainingTime('Submitted late');
        return;
      }

      const now = new Date();
      const diff = dueDate - now;

      if (diff <= 0) {
        setRemainingTime('');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);

      if (days > 0) {
        setRemainingTime(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setRemainingTime(`${hours}h ${mins}m left`);
      } else {
        setRemainingTime(`${mins}m left`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);

    return () => clearInterval(timer);
  }, [dueDate, klmsTimingStatus]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    const previousStatus = userStatus;

    setUserStatus(newStatus);

    if (onStatusChange) {
      try {
        await onStatusChange(assignment.id, newStatus);
      } catch (err) {
        setUserStatus(previousStatus);
        alert('Failed to sync with server. Please try again');
      }
    }
  };

  const toggleCompletion = () => {
    const newStatus = isCompleted ? 'todo' : 'completed';
    handleStatusChange({ target: { value: newStatus } });
  };

  const prefix = assignment.course_code ? assignment.course_code.replace(/[0-9]/g, '') : '';
  const courseColor = getPrefixColor(prefix);

  return (
    <div
      className={`card assignment-card ${isCompleted ? 'completed' : ''}`}
      style={{ '--course-color': courseColor }}
    >
      <div className="card-left-band" />

      <button
        className="card-icon-btn"
        onClick={toggleCompletion}
        aria-label="Toggle completion status"
      >
        {isCompleted ? (
          <CheckCircle2 size={24} color="var(--success-text)" />
        ) : (
          <Circle size={24} color="var(--text-muted)" />
        )}
      </button>

      <div className="card-content">
        <div className="card-header">
          <span className="course-code" style={{ color: courseColor }}>
            {assignment.course_code}
          </span>
          <span
            className={`countdown ${
              remainingTime === 'Overdue' || remainingTime === 'Submitted late' ? 'overdue' : ''
            }`}
          >
            {remainingTime}
          </span>
        </div>

        <h4 className="card-title">{assignment.title}</h4>
        <div className="card-deadline">Due: {formattedDate}</div>

        {isExpanded && (
          <div className="card-statuses">
            <div className="status-group">
              <label>My Status:</label>
              <select value={userStatus} onChange={handleStatusChange} className="status-select">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="status-group">
              <label>KLMS Sync:</label>
              <span className={`klms-badge ${klmsStatus.toLowerCase()}`}>
                {klmsStatus.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}
      </div>

      <button
        className="expand-btn"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
      >
        <ChevronRight color="#c7c7cc" className={`expand-icon ${isExpanded ? 'expanded' : ''}`} />
      </button>
    </div>
  );
}
