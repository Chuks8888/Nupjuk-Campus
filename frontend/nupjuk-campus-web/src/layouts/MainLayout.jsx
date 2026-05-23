import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon,
  BookOpen,
  Calendar,
  Users,
  Bell,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import { clearSession } from '../api/auth';
import '../styles/MainLayout.css';

export default function MainLayout() {
  const navigate = useNavigate();

  const userString = localStorage.getItem('currentUser');
  const user = userString ? JSON.parse(userString) : null;
  const displayName = user?.display_name || user?.kaist_email || 'Student';

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <GraduationCap size={32} color="#007AFF" />
          <h2>Nupjuk</h2>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/home" className="nav-item">
            <HomeIcon size={24} />
            <span className="nav-label">Home</span>
          </NavLink>

          <NavLink to="/courses" className="nav-item">
            <BookOpen size={24} />
            <span className="nav-label">Courses</span>
          </NavLink>

          <NavLink to="/calendar" className="nav-item">
            <Calendar size={24} />
            <span className="nav-label">Calendar</span>
          </NavLink>

          <NavLink to="/meetings" className="nav-item">
            <Users size={24} />
            <span className="nav-label">Meetings</span>
          </NavLink>

          <NavLink to="/alerts" className="nav-item">
            <Bell size={24} />
            <span className="nav-label">Alerts</span>
          </NavLink>

          <button onClick={handleLogout} className="nav-item logout-btn">
            <LogOut size={24} />
            <span className="nav-label">Log Out</span>
          </button>
          <div className="sidebar-bottom">
            <div className="user-section">
              <div className="user-info">
                Logged in as <br />
                <strong>{displayName}</strong>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
