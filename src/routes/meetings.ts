import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { broadcastMeetingUpdate } from "../realtime";

const router = Router();

async function canAccessCourse(userId: number, courseId: number) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  return !!(
    enrollment &&
    enrollment.status === "active" &&
    enrollment.validUntil >= new Date()
  );
}

async function getAccessibleMeeting(userId: number, meetingId: number) {
  const meeting = await prisma.meetingEvent.findUnique({
    where: { id: meetingId },
  });

  if (!meeting) return null;

  const hasAccess = await canAccessCourse(userId, meeting.courseId);
  return hasAccess ? meeting : null;
}

function normalizeSlots(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((slot): slot is string => typeof slot === "string")
    .map((slot) => new Date(slot).toISOString())
    .filter((slot) => !Number.isNaN(new Date(slot).getTime()));
}

router.get("/course/:courseId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const courseId = Number(req.params.courseId);

    if (!courseId) {
      return res.status(400).json({ error: "Invalid course ID format." });
    }

    const hasAccess = await canAccessCourse(userId, courseId);

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied. You are not enrolled in this course." });
    }

    const meetings = await prisma.meetingEvent.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: { id: true, displayName: true, kaistEmail: true },
        },
        participants: true,
      },
    });

    return res.json(meetings);
  } catch (error) {
    console.error("Error fetching course meetings:", error);
    return res.status(500).json({ error: "Failed to fetch meeting events." });
  }
});

router.get("/:meetingId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const meetingId = Number(req.params.meetingId);

    if (!meetingId) {
      return res.status(400).json({ error: "Invalid meeting ID format." });
    }

    const meeting = await getAccessibleMeeting(userId, meetingId);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found or access denied." });
    }

    const detailedMeeting = await prisma.meetingEvent.findUnique({
      where: { id: meetingId },
      include: {
        creator: {
          select: { id: true, displayName: true, kaistEmail: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, displayName: true, kaistEmail: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        availabilities: {
          include: {
            user: {
              select: { id: true, displayName: true, kaistEmail: true },
            },
          },
        },
      },
    });

    if (!detailedMeeting) {
      return res.status(404).json({ error: "Meeting not found." });
    }

    return res.json({
      ...detailedMeeting,
      myAvailableSlots: normalizeSlots(
        detailedMeeting.availabilities.find((availability) => availability.userId === userId)
          ?.availableSlots,
      ),
    });
  } catch (error) {
    console.error("Error fetching meeting details:", error);
    return res.status(500).json({ error: "Failed to fetch meeting details." });
  }
});

router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const creatorId = req.user!.userId;
    const { courseId, title, description, dateRangeStart, dateRangeEnd, timeRangeStart, timeRangeEnd } = req.body;

    if (!courseId || !title || !dateRangeStart || !dateRangeEnd || !timeRangeStart || !timeRangeEnd) {
      return res.status(400).json({ error: "Missing required fields for creating a meeting event." });
    }

    const parsedCourseId = Number(courseId);
    if (!parsedCourseId) {
      return res.status(400).json({ error: "Invalid course ID format." });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: creatorId,
          courseId: parsedCourseId,
        },
      },
    });

    if (!enrollment || enrollment.status !== "active") {
      return res.status(403).json({ error: "Access denied. You must be enrolled in this course to host a meeting." });
    }

    const meeting = await prisma.$transaction(async (tx) => {
      const created = await tx.meetingEvent.create({
        data: {
          courseId: parsedCourseId,
          creatorId,
          title,
          description,
          dateRangeStart: new Date(dateRangeStart),
          dateRangeEnd: new Date(dateRangeEnd),
          timeRangeStart,
          timeRangeEnd,
        },
      });

      await tx.meetingParticipant.create({
        data: {
          meetingEventId: created.id,
          userId: creatorId,
        },
      });

      return created;
    });

    return res.status(201).json({
      message: "Meeting event created successfully.",
      meeting,
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return res.status(500).json({ error: "Internal server error while creating meeting." });
  }
});

router.put("/:meetingId/availability", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const meetingId = Number(req.params.meetingId);
    const { availableSlots } = req.body;

    if (!meetingId) {
      return res.status(400).json({ error: "Invalid meeting ID format." });
    }

    if (!Array.isArray(availableSlots)) {
      return res.status(400).json({ error: "availableSlots must be an array." });
    }

    const meeting = await getAccessibleMeeting(userId, meetingId);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found or access denied." });
    }

    const normalizedSlots = normalizeSlots(availableSlots);

    const availability = await prisma.$transaction(async (tx) => {
      await tx.meetingParticipant.upsert({
        where: {
          meetingEventId_userId: { meetingEventId: meetingId, userId },
        },
        update: {},
        create: { meetingEventId: meetingId, userId },
      });

      return tx.meetingAvailability.upsert({
        where: {
          meetingEventId_userId: { meetingEventId: meetingId, userId },
        },
        update: { availableSlots: normalizedSlots },
        create: { meetingEventId: meetingId, userId, availableSlots: normalizedSlots },
      });
    });

    broadcastMeetingUpdate(meetingId);

    return res.json({ message: "Availability saved.", availability });
  } catch (error) {
    console.error("Error saving meeting availability:", error);
    return res.status(500).json({ error: "Failed to save meeting availability." });
  }
});

export default router;
