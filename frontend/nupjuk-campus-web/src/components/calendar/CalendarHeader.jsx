import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function CalendarHeader({ currentDate, onPrevMonth, onNextMonth, onAddEvent }) {
  return (
    <header className="page-header" style={{ marginBottom: 0 }}>
      <div className="calendar-controls">
        <button onClick={onPrevMonth} className="icon-button">
          <ChevronLeft size={20} />
        </button>
        <h1 className="calendar-month-title">
          {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
        </h1>
        <button onClick={onNextMonth} className="icon-button">
          <ChevronRight size={20} />
        </button>
        <button onClick={onAddEvent} className="btn-primary">
          <Plus size={18} /> Add Event
        </button>
      </div>
    </header>
  );
}
