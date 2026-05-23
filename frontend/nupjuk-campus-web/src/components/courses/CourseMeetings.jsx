export default function CourseMeetings({ meetings }) {
  if (!meetings || meetings.length === 0) {
    return <p className="empty-state">No meetings yet.</p>;
  }

  return (
    <div className="course-board-list">
      {meetings.map((meeting) => (
        <article className="board-post-card" key={meeting.id}>
          <div className="board-post-header">
            <span className="board-post-category">{meeting.status}</span>
            <span className="board-post-author">{meeting.creator_name}</span>
          </div>
          <h3>{meeting.title}</h3>
          <p>{meeting.description || 'No description.'}</p>
          <div className="board-post-meta">
            <span>
              {meeting.time_range_start} - {meeting.time_range_end}
            </span>
            <span>{meeting.participant_count} participants</span>
          </div>
        </article>
      ))}
    </div>
  );
}
