import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/course/:courseId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const courseId = Number(req.params.courseId);

    if (!courseId) {
      return res.status(400).json({ error: "Invalid course ID format." });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (!enrollment || enrollment.status !== "active") {
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
          status: "open",
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

export default router;
