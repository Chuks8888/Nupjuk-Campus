import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);

// GET /calendar/feed
router.get("/feed", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });

    const courseIds = enrollments.map((enrollment) => enrollment.courseId);

    const assignments = await prisma.assignment.findMany({
      where: {
        courseId: { in: courseIds },
        dueDate: { not: null },
      },
      include: {
        course: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    const personalEvents = await prisma.personalEvent.findMany({
      where: { userId },
      orderBy: {
        startTime: "asc",
      },
    });

    const meetings = await prisma.meetingEvent.findMany({
      where: {
        status: "finalized",
        participants: { some: { userId } },
        finalizedStartTime: { not: null },
        finalizedEndTime: { not: null },
      },
      include: {
        course: true,
      },
      orderBy: {
        finalizedStartTime: "asc",
      },
    });

    const assignmentEvents = assignments.map((assignment) => ({
      id: `assignment-${assignment.id}`,
      title: assignment.title,
      start: assignment.dueDate,
      end: assignment.dueDate,
      type: "assignment",
      courseId: assignment.courseId,
      courseName: assignment.course.courseName,
      url: assignment.assignmentUrl,
      source: assignment.source,
    }));

    const personalCalendarEvents = personalEvents.map((event) => ({
      id: `personal-${event.id}`,
      title: event.title,
      start: event.startTime,
      end: event.endTime,
      type: "personal",
      description: event.description,
      status: event.status,
    }));

    const meetingEvents = meetings.map((meeting) => ({
      id: `meeting-${meeting.id}`,
      title: meeting.title,
      start: meeting.finalizedStartTime,
      end: meeting.finalizedEndTime,
      type: "meeting",
      courseId: meeting.courseId,
      courseName: meeting.course.courseName,
      courseCode: meeting.course.courseCode,
      description: meeting.description,
    }));

    const feed = [...assignmentEvents, ...personalCalendarEvents, ...meetingEvents].sort(
      (a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime(),
    );

    return res.json(feed);
  } catch (error) {
    console.error("Failed to get calendar feed:", error);
    return res.status(500).json({ error: "Failed to get calendar feed" });
  }
});

export default router;
