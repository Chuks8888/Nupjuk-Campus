import { Home as HomeIcon, BookOpen, Calendar, Users, Bell } from 'lucide-react';
import '../styles/Home.css';
import '../styles/Navbar.css';

export default function Home() {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Nupjuk Campus</h1>
        <p>Last synced: 11:02 PM</p> {/* Reflected in SRS Design [cite: 161] */}
      </header>

      <main className="dashboard-content">
        <section className="welcome-widget">
          <h3>Welcome!</h3>
          <p>You have 4 courses verified for the 2026 Spring Semester. [cite: 189, 206]</p>
        </section>
        
        {/* Placeholder for future course cards */}
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