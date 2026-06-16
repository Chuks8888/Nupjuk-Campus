import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, Bell, BellOff, Settings } from 'lucide-react';
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
    }
  };

  const handleCreateMeeting = async (meeting) => {
    await createCourseMeeting(courseId, meeting);
    const updatedMeetings = await getCourseMeetings(courseId);
    setMeetings(updatedMeetings);
  };

  const handleCreatePreference = async () => {
    setIsUpdatingPref(true);

    const payload = {
      course_id: parseInt(courseId, 10),
      post_comment_enabled: true,
      deadline_enabled: true,
      meeting_enabled: true,
      email_enabled: false,
      deadline_reminder_timing: ['24h', '3h'],
    };

    try {
      const response = await updateNotificationPreferences(payload);
      if (response.preferences) {
        setCoursePreference(response.preferences);
      }
    } catch (err) {
      alert('Failed to create course notification preferences.');
      console.error(err);
    } finally {
      setIsUpdatingPref(false);
    }
  };

  const handleToggleCourseNotifications = async () => {
    if (!coursePreference) return; // Guard clause

    setIsUpdatingPref(true);
    const nextState = !coursePreference.deadline_enabled;

    const payload = {
      course_id: parseInt(courseId, 10),
      post_comment_enabled: nextState,
      deadline_enabled: nextState,
      meeting_enabled: nextState,
      email_enabled: coursePreference.email_enabled,
      deadline_reminder_timing: coursePreference.deadline_reminder_timing || ['24h', '3h'],
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
          {!coursePreference ? (
            <button
              className="alerts-action-button"
              onClick={handleCreatePreference}
              disabled={isUpdatingPref}
            >
              <Settings size={18} />
              <span style={{ marginLeft: '6px' }}>Create preference</span>
            </button>
          ) : (
            <button
              className={`alerts-action-button ${coursePreference.deadline_enabled ? 'active' : ''}`}
              onClick={handleToggleCourseNotifications}
              disabled={isUpdatingPref}
              title={
                coursePreference.deadline_enabled
                  ? 'Disable Course Notifications'
                  : 'Enable Course Notifications'
              }
            >
              {coursePreference.deadline_enabled ? <Bell size={18} /> : <BellOff size={18} />}
              <span style={{ marginLeft: '6px' }}>
                {coursePreference.deadline_enabled ? 'Notifications On' : 'Notifications Off'}
              </span>
            </button>
          )}
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
