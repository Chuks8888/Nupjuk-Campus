import { useState, useEffect } from 'react';
import CourseCard from '../components/common/CourseCard';
import AssignmentWidget from '../components/dashboard/AssignmentWidget';
import { getCourseAssignments, getCourses } from '../api/courses';

import '../styles/Home.css';
import '../styles/Cards.css';

export default function Home() {
  const [dashboardData, setDashboardData] = useState({
    courses: [],
    assignments: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const courses = await getCourses();
        const assignmentGroups = await Promise.all(
          courses.map((course) => getCourseAssignments(course.raw_id))
        );

        setDashboardData({
          courses,
          assignments: assignmentGroups.flat(),
        });
      } catch (error) {
        console.error('Failed to load dashboard data', error);
        setError(error.message || 'Failed to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div
        className="page-container"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Syncing...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      {error && <p className="empty-state">{error}</p>}

      <AssignmentWidget assignments={dashboardData.assignments} />

      <section className="dashboard-section">
        <div className="section-header">
          <h2>My Courses</h2>
          <span className="meta-text">{dashboardData.courses.length} enrolled</span>
        </div>

        <div className="cards-container">
          {dashboardData.courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  );
}
