import { getPrefixColor } from '../../utils/colorUtils';
import DetailCard from '../common/DetailCard';

export default function DayDetailList({ date, events, onEditPersonalEvent }) {
  const formatEventTime = (startStr, endStr) => {
    if (!startStr) return '';
    const startDate = new Date(startStr);
    const endDate = endStr ? new Date(endStr) : startDate;

    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const dateOptions = { month: 'short', day: 'numeric' };

    const isSameDay =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate();

    const startTimeFmt = startDate.toLocaleTimeString([], timeOptions);
    const endTimeFmt = endDate.toLocaleTimeString([], timeOptions);

    if (isSameDay) {
      if (startTimeFmt === endTimeFmt) return startTimeFmt;
      return `${startTimeFmt} - ${endTimeFmt}`;
    } else {
      return `${startDate.toLocaleDateString([], dateOptions)}, ${startTimeFmt} - ${endDate.toLocaleDateString([], dateOptions)}, ${endTimeFmt}`;
    }
  };

  return (
    <div className="day-detail-container">
      <h2 className="day-detail-title">
        Schedule for{' '}
        {date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </h2>

      {events.length === 0 ? (
        <p className="empty-state">No events scheduled for this day.</p>
      ) : (
        <div className="detail-list-container">
          {events.map((event) => {
            const isPersonal = event.type === 'personal';
            const isAssignment = event.type === 'assignment';

            const codeStr = String(event.courseCode || event.courseName || 'Personal');
            const prefix = codeStr.replace(/[0-9]/g, '');
            const color = isPersonal ? 'var(--brand-purple)' : getPrefixColor(prefix);

            const CategoryBadge = (
              <span className="event-category-badge" style={{ backgroundColor: color }}>
                {isPersonal ? 'Personal' : event.courseName}
              </span>
            );

            const rightMeta = isPersonal && event.status === 'todo' ? '' : event.status || '';

            return (
              <div
                key={event.id}
                onClick={() => isPersonal && onEditPersonalEvent(event)}
                className={isPersonal ? 'clickable-card' : ''}
              >
                <DetailCard
                  category={CategoryBadge}
                  author={isAssignment ? 'Assignment' : event.type}
                  title={event.title}
                  description={event.description || (isAssignment ? 'Due Date' : '')}
                  metaLeft={formatEventTime(event.start, event.end)}
                  metaRight={rightMeta}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
