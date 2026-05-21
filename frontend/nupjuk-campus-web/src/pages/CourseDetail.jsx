import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Paperclip, Users } from 'lucide-react';
import CourseTabs from '../components/courses/CourseTabs';
import AssignmentCard from '../components/common/AssignmentCard';
import { getCourse, getCourseAssignments, getCourseMeetings, getCoursePosts } from '../api/courses';
import '../styles/CourseDetail.css';
import '../styles/Cards.css';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tasks');
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
        
        <div className="course-header-icon" style={{ backgroundColor: '#007AFF' }}>
          {prefix}
        </div>
        
        <div className="course-header-info">
          <h1>{course.course_code}</h1>
          <p className="course-name">{course.course_name}</p>
          <div className="course-meta">
            <span className="meta-item"><Users size={14} /> {course.enrollment_count} enrolled</span>
            <span className="meta-item">{course.semester}</span>
          </div>
        </div>
      </header>

      <CourseTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="tab-content">
        {activeTab === 'board' && (
          <div className="course-board-list">
            {posts.map((post) => (
              <article className="board-post-card" key={post.id}>
                <div className="board-post-header">
                  <span className="board-post-category">{post.category}</span>
                  <span className="board-post-author">{post.author_name}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.body}</p>
                <div className="board-post-meta">
                  <span><MessageSquare size={14} /> {post.comment_count}</span>
                  <span><Paperclip size={14} /> {post.attachment_count}</span>
                </div>
              </article>
            ))}
            {posts.length === 0 && <p className="empty-state">No posts yet.</p>}
          </div>
        )}
        
        {activeTab === 'tasks' && (
          <div className="cards-container">
            {assignments.map(assignment => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
            
            {assignments.length === 0 && (
              <p className="empty-state">No tasks for this course.</p>
            )}
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="course-board-list">
            {meetings.map((meeting) => (
              <article className="board-post-card" key={meeting.id}>
                <div className="board-post-header">
                  <span className="board-post-category">{meeting.status}</span>
                  <span className="board-post-author">{meeting.creator_name}</span>
                </div>
                <h3>{meeting.title}</h3>
                <p>{meeting.description || 'No description.'}</p>
                <div className="board-post-meta">
                  <span>{meeting.time_range_start} - {meeting.time_range_end}</span>
                  <span>{meeting.participant_count} participants</span>
                </div>
              </article>
            ))}
            {meetings.length === 0 && <p className="empty-state">No meetings yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
