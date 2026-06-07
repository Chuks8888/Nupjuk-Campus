import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// ==========================================
// PART 1: Notification Inbox (The "Bell" Icon)
// ==========================================

// ------------------------------------------
// 1. GET /notifications
// Fetch the user's notifications (supports pagination and filtering by unread)
// ------------------------------------------
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const unreadOnly = req.query.unreadOnly === 'true'; // If true, only fetch unread

        const whereClause: any = { userId: userId };
        if (unreadOnly) {
            whereClause.isRead = false;
        }

        const skip = (page - 1) * limit;

        const [notifications, totalCount, unreadCount] = await prisma.$transaction([
            prisma.notification.findMany({
                where: whereClause,
                skip: skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.notification.count({ where: whereClause }),
            prisma.notification.count({ where: { userId: userId, isRead: false } }) // Always get total unread badge count
        ]);

        return res.status(200).json({
            data: notifications,
            meta: {
                totalCount,
                unreadCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
});

// ------------------------------------------
// 2. PATCH /notifications/:id/read
// Mark a specific notification as read when the user clicks it
// ------------------------------------------
router.patch('/:id/read', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const notificationId = parseInt(req.params.id as string);

        if (isNaN(notificationId)) {
            return res.status(400).json({ error: 'Invalid notification ID.' });
        }

        // Verify the notification belongs to this user
        const notification = await prisma.notification.findUnique({ where: { id: notificationId } });

        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ error: 'Notification not found.' });
        }

        const updatedNotification = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });

        return res.status(200).json({ message: 'Notification marked as read.', notification: updatedNotification });
    } catch (error) {
        console.error('Error updating notification:', error);
        return res.status(500).json({ error: 'Failed to mark notification as read.' });
    }
});

// ------------------------------------------
// 3. PATCH /notifications/read-all
// Mark all unread notifications for the user as read ("Mark all as read" button)
// ------------------------------------------
router.patch('/read-all', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;

        const result = await prisma.notification.updateMany({
            where: { userId: userId, isRead: false },
            data: { isRead: true }
        });

        return res.status(200).json({ message: `${result.count} notifications marked as read.` });
    } catch (error) {
        console.error('Error marking all as read:', error);
        return res.status(500).json({ error: 'Failed to mark all notifications as read.' });
    }
});

// ==========================================
// PART 2: Notification Preferences (Settings Page)
// ==========================================

// ------------------------------------------
// 4. GET /notifications/preferences
// Fetch user's notification settings (Global and per-course)
// ------------------------------------------
router.get('/preferences', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;

        const preferences = await prisma.notificationPreference.findMany({
            where: { userId: userId },
            include: {
                course: { select: { courseCode: true, courseName: true } } // Include course name if it's a per-course setting
            }
        });

        return res.status(200).json(preferences);
    } catch (error) {
        console.error('Error fetching preferences:', error);
        return res.status(500).json({ error: 'Failed to fetch notification preferences.' });
    }
});

// ------------------------------------------
// 5. PUT /notifications/preferences
// Update or create a notification preference (Global if courseId is null)
// ------------------------------------------
router.put('/preferences', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const { courseId, postCommentEnabled, deadlineEnabled, meetingEnabled, emailEnabled, deadlineReminderTiming } = req.body;

        // Check if a preference record already exists for this user and course combination
        const existingPref = await prisma.notificationPreference.findFirst({
            where: {
                userId: userId,
                courseId: courseId || null // null means it's a global setting
            }
        });

        let savedPref;

        if (existingPref) {
            // Update existing setting
            savedPref = await prisma.notificationPreference.update({
                where: { id: existingPref.id },
                data: {
                    postCommentEnabled: postCommentEnabled ?? existingPref.postCommentEnabled,
                    deadlineEnabled: deadlineEnabled ?? existingPref.deadlineEnabled,
                    meetingEnabled: meetingEnabled ?? existingPref.meetingEnabled,
                    emailEnabled: emailEnabled ?? existingPref.emailEnabled,
                    deadlineReminderTiming: deadlineReminderTiming ?? existingPref.deadlineReminderTiming
                }
            });
        } else {
            // Create new setting
            savedPref = await prisma.notificationPreference.create({
                data: {
                    userId: userId,
                    courseId: courseId || null,
                    postCommentEnabled: postCommentEnabled ?? true,
                    deadlineEnabled: deadlineEnabled ?? true,
                    meetingEnabled: meetingEnabled ?? true,
                    emailEnabled: emailEnabled ?? false,
                    deadlineReminderTiming: deadlineReminderTiming || ["1d", "3h"]
                }
            });
        }

        return res.status(200).json({ message: 'Preferences updated.', preferences: savedPref });
    } catch (error) {
        console.error('Error updating preferences:', error);
        return res.status(500).json({ error: 'Failed to update notification preferences.' });
    }
});

export default router;