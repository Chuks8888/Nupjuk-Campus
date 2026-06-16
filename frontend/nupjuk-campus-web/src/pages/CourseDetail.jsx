import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, Bell, BellOff } from 'lucide-react';
import CourseTabs from '../components/courses/CourseTabs';
import CourseBoard from '../components/courses/CourseBoard';
import CourseTasks from '../components/courses/CourseTasks';
import CourseMeetings from '../components/courses/CourseMeetings';
import {
  createCourseMeeting,
  getCourse,
  getCourseAssignments,
  getCourseMeetings,
  getCoursePosts,
  updateAssignmentStatus,
} from '../api/courses';
import { getNotificationPreferences, updateNotificationPreferences } from '../api/notifications';
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
  const [coursePreference, setCoursePreference] = useState(null);
  const [isUpdatingPref, setIsUpdatingPref] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCourseDetail = async () => {
      try {
        setIsLoading(true);
        setError('');
        const [courseData, assignmentData, postData, meetingData, prefData] = await Promise.all([
          getCourse(courseId),
          getCourseAssignments(courseId),
          getCoursePosts(courseId),
          getCourseMeetings(courseId),
          getNotificationPreferences(),
        ]);

        setCourse(courseData);
        setAssignments(assignmentData);
        setPosts(postData.data);
        setMeetings(meetingData);

        const currentPref = prefData.find(
          (p) => String(p.courseId || p.course_id) === String(courseId)
        );
        setCoursePreference(currentPref || null);
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

  const handleCreateMeeting = async (meeting) => {
    await createCourseMeeting(courseId, meeting);
    const updatedMeetings = await getCourseMeetings(courseId);
    setMeetings(updatedMeetings);
  };

  const handleToggleCourseNotifications = async () => {
    setIsUpdatingPref(true);

    const payload = {
      course_id: parseInt(courseId, 10),
      post_comment_enabled: coursePreference ? !coursePreference.post_comment_enabled : true,
      deadline_enabled: coursePreference ? !coursePreference.deadline_enabled : true,
      meeting_enabled: coursePreference ? !coursePreference.meeting_enabled : true,
      email_enabled: coursePreference ? coursePreference.email_enabled : false,
      deadline_reminder_timing: ['24h', '3h'],
    };

    try {
      const response = await updateNotificationPreferences(payload);
      if (response.preferences) {
        setCoursePreference(response.preferences);
      }
    } catch (err) {
      alert('Failed to update course notification preferences.');
      console.error(err);
    } finally {
      setIsUpdatingPref(false);
    }
  };

  if (isLoading) return <div className="course-detail-container">Loading course...</div>;
  if (error) return <div className="course-detail-container">{error}</div>;
  if (!course) return <div className="course-detail-container">Course not found</div>;

  const prefix = course.course_code.replace(/[0-9]/g, '');
  const notificationsEnabled = coursePreference?.deadline_enabled;

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

        <div className="course-header-actions" style={{ marginLeft: 'auto' }}>
          <button
            className={`alerts-action-button ${notificationsEnabled ? 'active' : ''}`}
            onClick={handleToggleCourseNotifications}
            disabled={isUpdatingPref}
            title={
              notificationsEnabled ? 'Disable Course Notifications' : 'Enable Course Notifications'
            }
          >
            {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
            <span style={{ marginLeft: '6px' }}>
              {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
            </span>
          </button>
        </div>
      </header>

      <CourseTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="tab-content">
        {activeTab === 'board' && <CourseBoard courseId={courseId} posts={posts} />}

        {activeTab === 'tasks' && (
          <CourseTasks assignments={assignments} onStatusChange={handleAssignmentStatusChange} />
        )}

        {activeTab === 'meetings' && (
          <CourseMeetings
            courseId={courseId}
            meetings={meetings}
            onCreateMeeting={handleCreateMeeting}
          />
        )}
      </div>
    </div>
  );
}
