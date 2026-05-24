import { getPrefixColor } from '../../utils/colorUtils';
import DetailCard from '../common/DetailCard';

export default function DayDetailList({ date, events, onEditPersonalEvent }) {
  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-strong)' }}>
        Schedule for{' '}
        {date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </h3>

      {events.length === 0 ? (
        <p className="empty-state">No events scheduled for this day.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {events.map((event) => {
            const isPersonal = event.type === 'personal';
            const isAssignment = event.type === 'assignment';

            const prefix = event.course_code?.replace(/[0-9]/g, '') || 'Personal';
            const color = isPersonal ? 'var(--brand-purple)' : getPrefixColor(prefix);

            const CategoryBadge = (
              <span className="event-category-badge" style={{ backgroundColor: color }}>
                {isPersonal ? 'Personal' : event.courseName}
              </span>
            );

            return (
              <div
                key={event.id}
                onClick={() => isPersonal && onEditPersonalEvent(event)}
                style={{ cursor: isPersonal ? 'pointer' : 'default' }}
              >
                <DetailCard
                  category={CategoryBadge}
                  author={isAssignment ? 'Assignment' : event.type}
                  title={event.title}
                  description={event.description || (isAssignment ? 'Due Date' : '')}
                  metaLeft={`${formatTime(event.start)} ${event.end && event.start !== event.end ? `- ${formatTime(event.end)}` : ''}`}
                  metaRight={event.status || ''}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
