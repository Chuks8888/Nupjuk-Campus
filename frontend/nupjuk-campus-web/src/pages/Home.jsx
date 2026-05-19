import { Home as HomeIcon, BookOpen, Calendar, Users, Bell } from 'lucide-react';
import CourseCard from '../components/dashboard/CourseCard';
import AssignmentCard from '../components/dashboard/AssignmentCard';
import { mockCourses, mockAssignments } from '../data/mockData';
import '../styles/Home.css';
import '../styles/Navbar.css';

export default function Home() {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Nupjuk Campus</h1>
        <p>Last synced: Just now</p>
      </header>

      <main className="dashboard-content">
        <section style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2>Upcoming Deadlines</h2>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent-color)', cursor: 'pointer' }}>View All &gt;</span>
          </div>
          {mockAssignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </section>
        <section style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2>My Courses</h2>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{mockCourses.length} enrolled</span>
          </div>
          {mockCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </section>
      </main>

      <nav className="bottom-nav">
        <div className="nav-item active">
          <HomeIcon size={24} />
          <span className="nav-label">Home</span>
        </div>
        <div className="nav-item">
          <BookOpen size={24} />
          <span className="nav-label">Courses</span> {/* Matches SRS F2 [cite: 77] */}
        </div>
        <div className="nav-item">
          <Calendar size={24} />
          <span className="nav-label">Calendar</span> {/* Matches SRS F3 [cite: 78] */}
        </div>
        <div className="nav-item">
          <Users size={24} />
          <span className="nav-label">Meetings</span> {/* Matches SRS F4 [cite: 79] */}
        </div>
        <div className="nav-item">
          <Bell size={24} />
          <span className="nav-label">Alerts</span> {/* Matches SRS F5 [cite: 80] */}
        </div>
      </nav>
    </div>
  );
}