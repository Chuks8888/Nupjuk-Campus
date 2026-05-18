import { Clock } from 'lucide-react';
import '../styles/Cards.css';

export default function AssignmentCard({ assignment }) {
  // Format the ISO date string into a readable format
  const dueDate = new Date(assignment.due_date).toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Clean up the status text (e.g., "in_progress" -> "In Progress")
  const statusText = assignment.user_completion_status.replace('_', ' ');

  return (
    <div className="card">
      <div className="card-icon">
        <Clock size={24} color="#ff3b30" /> {/* Red to indicate a deadline */}
      </div>
      <div className="card-content">
        <h4>{assignment.title}</h4>
        <p>Due: {dueDate} • Status: <span style={{ textTransform: 'capitalize' }}>{statusText}</span></p>
      </div>
    </div>
  );
}