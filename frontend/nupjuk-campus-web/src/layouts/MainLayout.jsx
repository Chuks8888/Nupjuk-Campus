import { NavLink, Outlet } from 'react-router-dom';
import { Home as HomeIcon, BookOpen, Calendar, Users, Bell, GraduationCap } from 'lucide-react';
import '../styles/MainLayout.css';

export default function MainLayout() {
  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <GraduationCap size={32} color="#007AFF" />
          <h2>Nupjuk</h2>
        </div>
        
        <nav className="sidebar-nav">
          {/* NavLink automatically adds the class "active" when the URL matches "to" */}
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
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet /> {/* This is where Home.jsx and etc. gets rendered */}
      </main>
    </div>
  );
}