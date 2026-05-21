import { apiRequest } from './http';

function normalizeCourse(course) {
  const board = course.boards?.[0] || null;

  return {
    id: String(course.id),
    raw_id: course.id,
    board_id: board?.id ?? null,
    course_code: course.courseCode ?? course.course_code,
    course_name: course.courseName ?? course.course_name,
    semester: course.semester,
    klms_course_id: course.klmsCourseId ?? course.klms_course_id,
    assignment_count: course._count?.assignments ?? 0,
    enrollment_count: course._count?.enrollments ?? 0,
    meeting_count: course._count?.meetings ?? 0,
  };
}

function normalizeAssignment(assignment) {
  const status = assignment.userStatuses?.[0];
  const completionStatus = status?.userCompletionStatus
    ?? assignment.userCompletionStatus
    ?? assignment.user_completion_status
    ?? 'todo';

  return {
    id: String(assignment.id),
    raw_id: assignment.id,
    course_id: String(assignment.courseId ?? assignment.course_id),
    course_code: assignment.course?.courseCode,
    title: assignment.title,
    due_date: assignment.dueDate ?? assignment.due_date,
    description: assignment.description,
    source: assignment.source,
    assignment_url: assignment.assignmentUrl,
    klms_submission_status: status?.klmsSubmissionStatus ?? assignment.klmsSubmissionStatus,
    user_completion_status: completionStatus,
  };
}

function normalizePost(post) {
  return {
    id: String(post.id),
    raw_id: post.id,
    title: post.title,
    body: post.body,
    category: post.category,
    created_at: post.createdAt,
    author_name: post.author?.displayName || post.author?.kaistEmail || 'Unknown',
    comment_count: post._count?.comments ?? post.comments?.length ?? 0,
    attachment_count: post._count?.attachments ?? post.attachments?.length ?? 0,
  };
}

function normalizeMeeting(meeting) {
  return {
    id: String(meeting.id),
    raw_id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    status: meeting.status,
    date_range_start: meeting.dateRangeStart,
    date_range_end: meeting.dateRangeEnd,
    time_range_start: meeting.timeRangeStart,
    time_range_end: meeting.timeRangeEnd,
    creator_name: meeting.creator?.displayName || meeting.creator?.kaistEmail || 'Unknown',
    participant_count: meeting.participants?.length ?? 0,
  };
}

export async function getCourses() {
  const courses = await apiRequest('/courses');
  return courses.map(normalizeCourse);
}

export async function getCourse(courseId) {
  const course = await apiRequest(`/courses/${courseId}`);
  return normalizeCourse(course);
}

export async function getCourseAssignments(courseId) {
  const assignments = await apiRequest(`/courses/${courseId}/assignments`);
  return assignments.map(normalizeAssignment);
}

export async function getCoursePosts(courseId) {
  const response = await apiRequest(`/courses/${courseId}/posts`);
  const posts = Array.isArray(response) ? response : response.data || [];

  return {
    data: posts.map(normalizePost),
    meta: response.meta || null,
  };
}

export async function getCourseMeetings(courseId) {
  const meetings = await apiRequest(`/meetings/course/${courseId}`);
  return meetings.map(normalizeMeeting);
}
