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

  const completionStatus =
    status?.userCompletionStatus ??
    assignment.userCompletionStatus ??
    assignment.user_completion_status ??
    'todo';

  const klmsSubmissionStatus =
    status?.klmsSubmissionStatus ??
    assignment.klmsSubmissionStatus ??
    assignment.klms_submission_status ??
    'not_submitted';

  const klmsTimingStatus =
    status?.klmsTimingStatus ??
    assignment.klmsTimingStatus ??
    assignment.klms_timing_status ??
    'on_time';

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

    klms_submission_status: klmsSubmissionStatus,
    klms_timing_status: klmsTimingStatus,

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
    course_id: String(meeting.courseId ?? ''),
    title: meeting.title,
    description: meeting.description,
    date_range_start: meeting.dateRangeStart,
    date_range_end: meeting.dateRangeEnd,
    time_range_start: meeting.timeRangeStart,
    time_range_end: meeting.timeRangeEnd,
    creator_name: meeting.creator?.displayName || meeting.creator?.kaistEmail || 'Unknown',
    participant_count: meeting.participants?.length ?? 0,
    my_available_slots: (meeting.myAvailableSlots || []).map((slot) =>
      new Date(slot).toISOString()
    ),
    participants:
      meeting.participants?.map((participant) => ({
        id: String(participant.userId ?? participant.user?.id ?? participant.id),
        raw_id: participant.userId ?? participant.user?.id ?? participant.id,
        name: participant.user?.displayName || participant.user?.kaistEmail || 'Unknown',
      })) ?? [],
    availabilities:
      meeting.availabilities?.map((availability) => ({
        user_id: availability.userId,
        user_name: availability.user?.displayName || availability.user?.kaistEmail || 'Unknown',
        available_slots: (availability.availableSlots || []).map((slot) =>
          new Date(slot).toISOString()
        ),
      })) ?? [],
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

export async function getMeetingDetail(meetingId) {
  return normalizeMeeting(await apiRequest(`/meetings/${meetingId}`));
}

export async function createCourseMeeting(courseId, meeting) {
  const response = await apiRequest('/meetings', {
    method: 'POST',
    body: {
      courseId,
      title: meeting.title,
      description: meeting.description,
      dateRangeStart: meeting.dateRangeStart,
      dateRangeEnd: meeting.dateRangeEnd,
      timeRangeStart: meeting.timeRangeStart,
      timeRangeEnd: meeting.timeRangeEnd,
    },
  });

  return response.meeting ? normalizeMeeting(response.meeting) : response;
}

export async function saveMeetingAvailability(meetingId, availableSlots) {
  return await apiRequest(`/meetings/${meetingId}/availability`, {
    method: 'POST',
    body: { availableSlots },
  });
}

export async function updateAssignmentStatus(courseId, assignmentId, status) {
  const response = await apiRequest(`/courses/${courseId}/assignments/${assignmentId}/status`, {
    method: 'POST',
    body: {
      userCompletionStatus: status,
    },
  });

  return response;
}
