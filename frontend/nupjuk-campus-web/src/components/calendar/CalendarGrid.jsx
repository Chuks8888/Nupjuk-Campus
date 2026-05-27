import { getPrefixColor } from '../../utils/colorUtils';

export default function CalendarGrid({ currentDate, selectedDate, eventsByDate, onSelectDate }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalCells = [...blanks, ...days];

  const toLocalDateString = (dateObj) => {
    const d = new Date(dateObj);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="calendar-wrapper">
      <div className="calendar-days-header">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {totalCells.map((day, index) => {
          if (!day) return <div key={`blank-${index}`} className="calendar-cell blank" />;

          const cellDate = new Date(year, month, day);
          const dateKey = toLocalDateString(cellDate);
          const dayEvents = eventsByDate[dateKey] || [];

          const isSelected = selectedDate.toDateString() === cellDate.toDateString();
          const isToday = new Date().toDateString() === cellDate.toDateString();

          return (
            <div
              key={day}
              onClick={() => onSelectDate(cellDate)}
              className={`calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
            >
              <div className="cell-date">{day}</div>

              <div className="event-dots">
                {dayEvents.slice(0, 6).map((evt) => {
                  const codeStr = String(evt.courseCode || evt.courseName || '');
                  const prefix = codeStr.replace(/[0-9]/g, '');
                  const color =
                    evt.type === 'personal' ? 'var(--brand-purple)' : getPrefixColor(prefix);

                  return (
                    <div
                      key={evt.id}
                      title={evt.title}
                      className="event-dot"
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
                {dayEvents.length > 6 && <div className="event-more">+{dayEvents.length - 6}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
