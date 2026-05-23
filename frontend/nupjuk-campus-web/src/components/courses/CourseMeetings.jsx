import { Clock, Users } from 'lucide-react'; // Added icons for visual consistency!
import DetailCard from '../common/DetailCard';

export default function CourseMeetings({ meetings }) {
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!meetings || meetings.length === 0) return <p className="empty-state">No meetings yet.</p>;

  return (
    <div className="detail-list-container">
      {meetings.map((meeting) => (
        <DetailCard
          key={meeting.id}
          category={meeting.status}
          author={meeting.creator_name}
          title={meeting.title}
          description={meeting.description || 'No description.'}
          metaLeft={
            <>
              <Clock size={14} /> {formatTime(meeting.time_range_start)} -{' '}
              {formatTime(meeting.time_range_end)}
            </>
          }
          metaRight={
            <>
              <Users size={14} /> {meeting.participant_count} participants
            </>
          }
        />
      ))}
    </div>
  );
}
