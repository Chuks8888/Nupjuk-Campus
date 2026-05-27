import { useEffect, useState } from 'react';
import { getCalendarFeed } from '../api/calendar';
import CalendarHeader from '../components/calendar/CalendarHeader';
import CalendarGrid from '../components/calendar/CalendarGrid';
import DayDetailList from '../components/calendar/DayDetailList';
import PersonalEventModal from '../components/calendar/PersonalEventModal';
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

  const toLocalDateString = (dateObj) => {
    const d = new Date(dateObj);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const eventsByDate = events.reduce((acc, event) => {
    if (!event.start) return acc;

    let current = new Date(event.start);
    const end = new Date(event.end || event.start);

    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let days = 0;
    while (current <= end && days < 365) {
      const dateKey = toLocalDateString(current);
      if (!acc[dateKey]) acc[dateKey] = [];

      if (!acc[dateKey].some((e) => e.id === event.id)) {
        acc[dateKey].push(event);
      }

      current.setDate(current.getDate() + 1);
      days++;
    }
    return acc;
  }, {});

  const selectedDateKey = toLocalDateString(selectedDate);
  const selectedDayEvents = eventsByDate[selectedDateKey] || [];

  return (
    <div className="calendar-container">
      <CalendarHeader
        currentDate={currentDate}
        onPrevMonth={() =>
          setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
        }
        onNextMonth={() =>
          setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
        }
        onAddEvent={() => {
          setEditingEvent(null);
          setIsModalOpen(true);
        }}
      />

      <div className="calendar-layout">
        <CalendarGrid
          currentDate={currentDate}
          selectedDate={selectedDate}
          eventsByDate={eventsByDate}
          onSelectDate={setSelectedDate}
        />

        <DayDetailList
          date={selectedDate}
          events={selectedDayEvents}
          onEditPersonalEvent={(evt) => {
            setEditingEvent(evt);
            setIsModalOpen(true);
          }}
        />
      </div>

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
