import { Clock } from 'lucide-react';
import '../../styles/Cards.css';

export default function AssignmentCard({ assignment }) {
  // Formats to match: "Apr 11, 08:59 AM"
  const dueDate = new Date(assignment.due_date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const statusText = assignment.user_completion_status.replace('_', ' ');

  return (
    <div className="card">
      <div className="card-icon">
        <Clock size={24} color="#ff3b30" /> 
      </div>
      <div className="card-content">
        <h4>{assignment.title}</h4>
        <p>Due: {dueDate} • Status: <span style={{ textTransform: 'capitalize' }}>{statusText}</span></p>
      </div>
    </div>
  );
}