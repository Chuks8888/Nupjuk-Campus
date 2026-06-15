import express, { Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// ==========================================
// 1. GET /me
// Fetch current user profile
// ==========================================
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<any> => {
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
  },
);

// ==========================================
// 2. GET /me/calendar
// Fetch unified calendar data: personal events + course assignments + meeting schedules
// ==========================================
router.get(
  "/calendar",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user!.userId;

      const { start, end } = req.query;
      const dateFilter: any = {};
      if (start && end) {
        dateFilter.gte = new Date(start as string);
        dateFilter.lte = new Date(end as string);
      }

      const personalEvents = await prisma.personalEvent.findMany({
        where: {
          userId: userId,
          ...(start && end ? { startTime: dateFilter } : {}),
        },
      });

      const enrolledCourses = await prisma.enrollment.findMany({
        where: { userId: userId, status: "active" },
        select: { courseId: true },
      });
      const courseIds = enrolledCourses.map((e) => e.courseId);

      const assignments = await prisma.assignment.findMany({
        where: {
          courseId: { in: courseIds },
          ...(start && end ? { dueDate: dateFilter } : {}),
        },
        include: {
          course: { select: { courseCode: true, courseName: true } },
          userStatuses: { where: { userId: userId } },
        },
      });

      const meetings = await prisma.meetingEvent.findMany({
        where: {
          status: "finalized",
          participants: { some: { userId: userId } },
          ...(start && end ? { finalizedStartTime: dateFilter } : {}),
        },
        include: {
          course: { select: { courseCode: true } },
        },
      });

      return res.status(200).json({
        personalEvents,
        assignments,
        meetings,
      });
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      return res.status(500).json({ error: "Failed to fetch calendar data." });
    }
  },
);

// ==========================================
// 3. PATCH /me
// Update user profile (displayName, bio)
// ==========================================
router.patch(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user!.userId;
      const { displayName, bio } = req.body;

      // If the user didn't provide any fields to update, return an error
      if (!displayName && bio === undefined) {
        return res
          .status(400)
          .json({ error: "No fields provided for update." });
      }

      // Construct the update data object (only include fields provided by the frontend)
      const updateData: any = {};
      if (displayName) updateData.displayName = displayName;
      if (bio !== undefined) updateData.bio = bio;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          kaistEmail: true,
          displayName: true,
          bio: true, // return the updated bio as well
        },
      });

      return res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      return res.status(500).json({ error: "Failed to update profile." });
    }
  },
);

export default router;
