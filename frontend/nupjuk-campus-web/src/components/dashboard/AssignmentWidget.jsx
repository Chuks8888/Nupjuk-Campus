import AssignmentCard from '../common/AssignmentCard';
import { updateAssignmentStatus } from '../../api/courses';

export default function AssignmentWidget({ assignments }) {
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const upcomingAssignments = assignments.filter((assignment) => {
    const dueDate = new Date(assignment.due_date);
    return dueDate >= now && dueDate <= nextWeek;
  });

  // Sort by closest deadline
  upcomingAssignments.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const handleStatusChange = async (courseId, assignmentId, newStatus) => {
    try {
      await updateAssignmentStatus(courseId, assignmentId, newStatus);
    } catch (error) {
      console.error('Failed to update assignment status:', error);
      throw error;
    }
  };

  return (
    <div className="widget-container">
      <div className="section-header">
        <h2>Upcoming Deadlines</h2>
      </div>

      {upcomingAssignments.length === 0 ? (
        <p className="empty-state">No assignments due in the next 7 days. Enjoy!</p>
      ) : (
        <div className="cards-container">
          {upcomingAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onStatusChange={(id, status) => handleStatusChange(assignment.course_id, id, status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
