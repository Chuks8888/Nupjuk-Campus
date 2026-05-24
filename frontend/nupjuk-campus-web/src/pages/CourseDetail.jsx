import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import CourseTabs from '../components/courses/CourseTabs';
import CourseBoard from '../components/courses/CourseBoard';
import CourseTasks from '../components/courses/CourseTasks';
import CourseMeetings from '../components/courses/CourseMeetings';
import {
  getCourse,
  getCourseAssignments,
  getCourseMeetings,
  getCoursePosts,
  updateAssignmentStatus,
} from '../api/courses';
import { getPrefixColor } from '../utils/colorUtils';
import '../styles/CourseDetail.css';
import '../styles/Cards.css';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'tasks');
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [posts, setPosts] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCourseDetail = async () => {
      try {
        setIsLoading(true);
        setError('');
        const [courseData, assignmentData, postData, meetingData] = await Promise.all([
          getCourse(courseId),
          getCourseAssignments(courseId),
          getCoursePosts(courseId),
          getCourseMeetings(courseId),
        ]);

        setCourse(courseData);
        setAssignments(assignmentData);
        setPosts(postData.data);
        setMeetings(meetingData);
      } catch (err) {
        setError(err.message || 'Failed to load course detail.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourseDetail();
  }, [courseId]);

  const handleAssignmentStatusChange = async (assignmentId, newStatus) => {
    const previousAssignments = [...assignments];

    try {
      setAssignments((prevAssignments) =>
        prevAssignments.map((a) =>
          a.id === assignmentId ? { ...a, user_completion_status: newStatus } : a
        )
      );

      await updateAssignmentStatus(courseId, assignmentId, newStatus);
    } catch (error) {
      setAssignments(previousAssignments);
      alert('Failed to save assignment status. Please try again.');
      console.error('Failed to sync status with server:', error);
    }
  };

  if (isLoading) return <div className="course-detail-container">Loading course...</div>;
  if (error) return <div className="course-detail-container">{error}</div>;
  if (!course) return <div className="course-detail-container">Course not found</div>;

  const prefix = course.course_code.replace(/[0-9]/g, '');

  return (
    <div className="course-detail-container">
      <header className="course-detail-header">
        <button onClick={() => navigate('/courses')} className="back-button">
          <ArrowLeft size={24} />
        </button>

        <div className="course-header-icon" style={{ backgroundColor: getPrefixColor(prefix) }}>
          {prefix}
        </div>

        <div className="course-header-info">
          <h1>{course.course_code}</h1>
          <p className="course-name">{course.course_name}</p>
          <div className="course-meta">
            <span className="meta-item">
              <Users size={14} /> {course.enrollment_count} enrolled
            </span>
            <span className="meta-item">{course.semester}</span>
          </div>
        </div>
      </header>

      <CourseTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="tab-content">
        {activeTab === 'board' && <CourseBoard courseId={courseId} posts={posts} />}

        {activeTab === 'tasks' && (
          <CourseTasks assignments={assignments} onStatusChange={handleAssignmentStatusChange} />
        )}

        {activeTab === 'meetings' && <CourseMeetings meetings={meetings} />}
      </div>
    </div>
  );
}
