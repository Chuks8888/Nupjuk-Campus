import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === "true";

    const whereClause: any = { userId };
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const skip = (page - 1) * limit;
    const [notifications, totalCount, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return res.json({
      data: notifications,
      meta: {
        totalCount,
        unreadCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

router.patch("/:id/read", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const notificationId = Number(req.params.id);

    if (!notificationId) {
      return res.status(400).json({ error: "Invalid notification ID." });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ error: "Notification not found." });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return res.json({
      message: "Notification marked as read.",
      notification: updatedNotification,
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    return res.status(500).json({ error: "Failed to mark notification as read." });
  }
});

router.patch("/read-all", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return res.json({ message: `${result.count} notifications marked as read.` });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return res.status(500).json({ error: "Failed to mark all notifications as read." });
  }
});

router.get("/preferences", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const preferences = await prisma.notificationPreference.findMany({
      where: { userId },
      include: {
        course: { select: { courseCode: true, courseName: true } },
      },
    });

    return res.json(preferences);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return res.status(500).json({ error: "Failed to fetch notification preferences." });
  }
});

router.put("/preferences", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      courseId,
      postCommentEnabled,
      deadlineEnabled,
      meetingEnabled,
      emailEnabled,
      deadlineReminderTiming,
    } = req.body;

    const existingPreference = await prisma.notificationPreference.findFirst({
      where: {
        userId,
        courseId: courseId || null,
      },
    });

    const savedPreference = existingPreference
      ? await prisma.notificationPreference.update({
          where: { id: existingPreference.id },
          data: {
            postCommentEnabled: postCommentEnabled ?? existingPreference.postCommentEnabled,
            deadlineEnabled: deadlineEnabled ?? existingPreference.deadlineEnabled,
            meetingEnabled: meetingEnabled ?? existingPreference.meetingEnabled,
            emailEnabled: emailEnabled ?? existingPreference.emailEnabled,
            deadlineReminderTiming: deadlineReminderTiming ?? existingPreference.deadlineReminderTiming,
          },
        })
      : await prisma.notificationPreference.create({
          data: {
            userId,
            courseId: courseId || null,
            postCommentEnabled: postCommentEnabled ?? true,
            deadlineEnabled: deadlineEnabled ?? true,
            meetingEnabled: meetingEnabled ?? true,
            emailEnabled: emailEnabled ?? false,
            deadlineReminderTiming: deadlineReminderTiming || ["1d", "3h"],
          },
        });

    return res.json({
      message: "Preferences updated.",
      preferences: savedPreference,
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return res.status(500).json({ error: "Failed to update notification preferences." });
  }
});

export default router;
