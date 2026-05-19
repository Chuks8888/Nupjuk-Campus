import CourseCard from '../components/dashboard/CourseCard';
import AssignmentCard from '../components/dashboard/AssignmentCard';
import { mockCourses, mockAssignments } from '../data/mockData';
import '../styles/Home.css';

export default function Home() {
  return (
    <div className="page-container">
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Last synced: Just now</p>
      </header>

      <div className="dashboard-content">
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <h2>Upcoming Deadlines</h2>
            <span style={{ fontSize: '0.9rem', color: '#007AFF', cursor: 'pointer' }}>View All &gt;</span>
          </div>
          <div className="cards-container">
            {mockAssignments.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        </section>
        
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <h2>My Courses</h2>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{mockCourses.length} enrolled</span>
          </div>
          <div className="cards-container">
            {mockCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}