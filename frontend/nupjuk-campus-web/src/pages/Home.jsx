import { useState, useEffect } from 'react';
import CourseCard from '../components/dashboard/CourseCard';
import AssignmentWidget from '../components/dashboard/AssignmentWidget';

// Mocks
import { mockCourses, mockAssignments } from '../data/mockData';

import '../styles/Home.css';
import '../styles/Cards.css';

export default function Home() {
  const [dashboardData, setDashboardData] = useState({
    courses: [],
    assignments: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setDashboardData({
          courses: mockCourses,
          assignments: mockAssignments 
        });
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Syncing...</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
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