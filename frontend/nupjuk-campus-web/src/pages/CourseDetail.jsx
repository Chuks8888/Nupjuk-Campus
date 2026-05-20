import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import CourseTabs from '../components/courses/CourseTabs';
import AssignmentCard from '../components/common/AssignmentCard';
import { mockCourses, mockAssignments } from '../data/mockData';
import '../styles/CourseDetail.css';
import '../styles/Cards.css';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tasks');

  const course = mockCourses.find(c => c.id === courseId);
  if (!course) return <div className="course-detail-container">Course not found</div>;

  const prefix = course.course_code.replace(/[0-9]/g, '');

  return (
    <div className="course-detail-container">
      
      <header className="course-detail-header">
        <button onClick={() => navigate('/courses')} className="back-button">
          <ArrowLeft size={24} />
        </button>
        
        {/* Color remains inline to match the dynamic hashing from CourseCard if you implement it here */}
        <div className="course-header-icon" style={{ backgroundColor: '#007AFF' }}>
          {prefix}
        </div>
        
        <div className="course-header-info">
          <h1>{course.course_code}</h1>
          <p className="course-name">{course.course_name}</p>
          <div className="course-meta">
            <span className="meta-item"><Users size={14} /> 89 enrolled</span>
            <span className="meta-item">2026 Spring</span>
          </div>
        </div>
      </header>

      <CourseTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="tab-content">
        {activeTab === 'board' && (
          <div>
            <p>Board content loading...</p>
          </div>
        )}
        
        {activeTab === 'tasks' && (
          <div className="cards-container">
            {mockAssignments
              .filter(assignment => assignment.course_id === course.id)
              .map(assignment => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
            
            {mockAssignments.filter(a => a.course_id === course.id).length === 0 && (
              <p className="empty-state">No tasks for this course.</p>
            )}
          </div>
        )}

        {activeTab === 'meetings' && <p>Meeting scheduler placeholder</p>}
      </div>
    </div>
  );
}