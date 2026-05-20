import { Clock, CheckCircle2 } from 'lucide-react';
import '../../styles/Cards.css';

export default function AssignmentCard({ assignment }) {
  const dueDate = new Date(assignment.due_date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const statusText = assignment.user_completion_status.replace('_', ' ');
  const isCompleted = assignment.user_completion_status === 'completed';

  return (
    <div className={`card ${isCompleted ? 'completed' : ''}`}>
      <div className="card-icon assignment-icon">
        {isCompleted ? (
          <CheckCircle2 size={24} color="#34C759" />
        ) : (
          <Clock size={24} color="#ff3b30" />
        )}
      </div>
      <div className="card-content">
        <h4>{assignment.title}</h4>
        <p>Due: {dueDate} • Status: <span className="status-text">{statusText}</span></p>
      </div>
    </div>
  );
}