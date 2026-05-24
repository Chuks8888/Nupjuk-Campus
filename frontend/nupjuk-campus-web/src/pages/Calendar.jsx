import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { getCalendarFeed } from '../api/calendar';
import { getPrefixColor } from '../utils/colorUtils';
import PersonalEventModal from '../components/calendar/PersonalEventModal';
import DayDetailList from '../components/calendar/DayDetailList';
import '../styles/Calendar.css';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await getCalendarFeed();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load calendar feed:', error);
    }
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const toLocalDateString = (dateObj) => {
    const d = new Date(dateObj);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = toLocalDateString(event.start);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  const renderGrid = () => {
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalCells = [...blanks, ...days];

    return totalCells.map((day, index) => {
      if (!day) return <div key={`blank-${index}`} className="calendar-cell blank" />;

      const cellDate = new Date(year, month, day);
      const dateKey = toLocalDateString(cellDate);
      const dayEvents = eventsByDate[dateKey] || [];

      const isSelected = selectedDate.toDateString() === cellDate.toDateString();
      const isToday = new Date().toDateString() === cellDate.toDateString();

      return (
        <div
          key={day}
          onClick={() => setSelectedDate(cellDate)}
          className={`calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
        >
          <div className="cell-date">{day}</div>

          <div className="event-dots">
            {dayEvents.slice(0, 6).map((evt) => {
              const prefix = evt.course_code?.replace(/[0-9]/g, '') || '';
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
    });
  };

  const selectedDateKey = toLocalDateString(selectedDate);
  const selectedDayEvents = eventsByDate[selectedDateKey] || [];

  return (
    <div className="calendar-container">
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div className="calendar-controls">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="calendar-nav-btn"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="calendar-month-title">
            {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
          </h1>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="calendar-nav-btn"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <button
          onClick={() => {
            setEditingEvent(null);
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={18} /> Add Event
        </button>
      </header>

      <div>
        <div className="calendar-days-header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="calendar-grid">{renderGrid()}</div>
      </div>

      <DayDetailList
        date={selectedDate}
        events={selectedDayEvents}
        onEditPersonalEvent={(evt) => {
          setEditingEvent(evt);
          setIsModalOpen(true);
        }}
      />

      <PersonalEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        existingEvent={editingEvent}
        onEventSaved={loadEvents}
      />
    </div>
  );
}
