import { useEffect, useState } from 'react';
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
import { getNotifications } from '../api/notifications';
import '../styles/MainLayout.css';

const NAV_ITEMS = [
  { path: '/home', icon: HomeIcon, label: 'Home' },
  { path: '/courses', icon: BookOpen, label: 'Courses' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/meetings', icon: Users, label: 'Meetings' },
  { path: '/alerts', icon: Bell, label: 'Alerts' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const userString = localStorage.getItem('currentUser');
  const user = userString ? JSON.parse(userString) : null;
  const displayName = user?.display_name || user?.kaist_email || 'Student';

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  useEffect(() => {
    let isMounted = true;

    const loadUnreadStatus = async () => {
      try {
        const response = await getNotifications({ limit: 1, unreadOnly: true });
        const unreadCount = response.meta?.unreadCount ?? response.data.length;
        if (isMounted) {
          setHasUnreadNotifications(unreadCount > 0);
        }
      } catch (error) {
        if (isMounted) {
          setHasUnreadNotifications(false);
        }
      }
    };

    loadUnreadStatus();
    window.addEventListener('focus', loadUnreadStatus);
    window.addEventListener('notifications:updated', loadUnreadStatus);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', loadUnreadStatus);
      window.removeEventListener('notifications:updated', loadUnreadStatus);
    };
  }, []);

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <GraduationCap size={32} color="#007AFF" />
          <h2>Nupjuk</h2>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <NavLink key={path} to={path} className="nav-item">
              <span className="nav-icon-wrap">
                <Icon size={24} />
                {path === '/alerts' && hasUnreadNotifications && (
                  <span className="notification-dot" aria-label="Unread notifications" />
                )}
              </span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
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
