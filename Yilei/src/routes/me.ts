import express, { Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// ==========================================
// 1. GET /me
// ==========================================
router.get("/", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      studentId: true,
      kaistEmail: true,
      displayName: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json(user);
});

// ==========================================
// 2. POST /me/events
// Create PersonalEvent
// ==========================================
router.post("/events", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const { title, startTime, endTime, description } = req.body;

        if (!title || !startTime || !endTime) {
            return res.status(400).json({ error: "Title, startTime, and endTime are required." });
        }

        const newEvent = await prisma.personalEvent.create({
            data: {
                userId: userId,
                title: title,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                description: description || null
            }
        });

        return res.status(201).json({ message: "Personal event created.", event: newEvent });
    } catch (error) {
        console.error("Error creating personal event:", error);
        return res.status(500).json({ error: "Failed to create personal event." });
    }
});

// ==========================================
// 3. DELETE /me/events/:eventId
// Delete PersonalEvent
// ==========================================
router.delete("/events/:eventId", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const eventId = parseInt(req.params.eventId as string);

        if (isNaN(eventId)) return res.status(400).json({ error: "Invalid event ID." });

        const existingEvent = await prisma.personalEvent.findUnique({ where: { id: eventId } });

        if (!existingEvent || existingEvent.userId !== userId) {
            return res.status(404).json({ error: "Event not found or access denied." });
        }

        await prisma.personalEvent.delete({ where: { id: eventId } });
        return res.status(200).json({ message: "Event deleted successfully." });
    } catch (error) {
        console.error("Error deleting personal event:", error);
        return res.status(500).json({ error: "Failed to delete personal event." });
    }
});

// ==========================================
// 4. GET /me/calendar
// Fetch unified calendar data: personal events + course assignments + meeting schedules
// ==========================================
router.get("/calendar", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        
        // Allow frontend to fetch data by month (optional), if not provided, fetch all
        const { start, end } = req.query;
        const dateFilter: any = {};
        if (start && end) {
            dateFilter.gte = new Date(start as string);
            dateFilter.lte = new Date(end as string);
        }

        // 1. Fetch the user's personal events
        const personalEvents = await prisma.personalEvent.findMany({
            where: { 
                userId: userId,
                ...(start && end ? { startTime: dateFilter } : {})
            }
        });

        // 2. Fetch all assignments for the user's enrolled courses (with optional date filtering)
        const enrolledCourses = await prisma.enrollment.findMany({
            where: { userId: userId, status: "active" },
            select: { courseId: true }
        });
        const courseIds = enrolledCourses.map(e => e.courseId);

        const assignments = await prisma.assignment.findMany({
            where: { 
                courseId: { in: courseIds },
                ...(start && end ? { dueDate: dateFilter } : {})
            },
            include: {
                course: { select: { courseCode: true, courseName: true } },
                userStatuses: { where: { userId: userId } } // Include the user's completion status for each assignment
            }
        });

        // 3. Fetch the meetings that the user has participated in (with optional date filtering)
        const meetings = await prisma.meetingEvent.findMany({
            where: {
                status: "finalized",
                participants: { some: { userId: userId } }, // Only include meetings where the user is a participant
                ...(start && end ? { finalizedStartTime: dateFilter } : {})
            },
            include: {
                course: { select: { courseCode: true } }
            }
        });

        // Package the data for the frontend, which will render it on the calendar by category
        return res.status(200).json({
            personalEvents,
            assignments,
            meetings
        });

    } catch (error) {
        console.error("Error fetching calendar data:", error);
        return res.status(500).json({ error: "Failed to fetch calendar data." });
    }
});

export default router;