import AssignmentCard from '../common/AssignmentCard';

export default function CourseTasks({ assignments, onStatusChange }) {
  if (!assignments || assignments.length === 0) {
    return <p className="empty-state">No tasks for this course.</p>;
  }

  return (
    <div className="cards-container">
      {assignments.map((assignment) => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
