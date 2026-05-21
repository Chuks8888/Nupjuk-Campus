import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// ==========================================
// 1. POST /meetings
// Create a new meeting poll/event within a specific course
// ==========================================
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const creatorId = req.user!.userId;
        const { courseId, title, description, dateRangeStart, dateRangeEnd, timeRangeStart, timeRangeEnd } = req.body;

        // Input Validation
        if (!courseId || !title || !dateRangeStart || !dateRangeEnd || !timeRangeStart || !timeRangeEnd) {
            return res.status(400).json({ error: 'Missing required fields for creating a meeting event.' });
        }

        const parsedCourseId = parseInt(courseId as string);
        if (isNaN(parsedCourseId)) {
            return res.status(400).json({ error: 'Invalid course ID format.' });
        }

        // Security Check: Verify that the creator is actually enrolled in this course
        const isEnrolled = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: creatorId,
                    courseId: parsedCourseId
                }
            }
        });

        if (!isEnrolled) {
            return res.status(403).json({ error: 'Access denied. You must be enrolled in this course to host a meeting.' });
        }

        // Database Action: Create the meeting and automatically add the creator as the first participant
        const newMeeting = await prisma.$transaction(async (tx) => {
            const meeting = await tx.meetingEvent.create({
                data: {
                    courseId: parsedCourseId,
                    creatorId: creatorId,
                    title: title,
                    description: description,
                    dateRangeStart: new Date(dateRangeStart),
                    dateRangeEnd: new Date(dateRangeEnd),
                    timeRangeStart: timeRangeStart,
                    timeRangeEnd: timeRangeEnd,
                    status: 'open'
                }
            });

            await tx.meetingParticipant.create({
                data: {
                    meetingEventId: meeting.id,
                    userId: creatorId
                }
            });

            return meeting;
        });

        return res.status(201).json({
            message: 'Meeting event created successfully.',
            meeting: newMeeting
        });
    } catch (error) {
        console.error('Error creating meeting:', error);
        return res.status(500).json({ error: 'Internal server error while creating meeting.' });
    }
});

// ==========================================
// 2. GET /meetings/course/:courseId
// Fetch all meeting events belonging to a specific course
// ==========================================
router.get('/course/:courseId', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const courseId = parseInt(req.params.courseId as string);

        if (isNaN(courseId)) {
            return res.status(400).json({ error: 'Invalid course ID format.' });
        }

        // Security Check: Verify user enrollment
        const isEnrolled = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: { userId, courseId }
            }
        });

        if (!isEnrolled) {
            return res.status(403).json({ error: 'Access denied. You are not enrolled in this course.' });
        }

        // Query: Fetch all meetings for this course
        const meetings = await prisma.meetingEvent.findMany({
            where: { courseId: courseId },
            orderBy: { createdAt: 'desc' },
            include: {
                creator: {
                    select: { id: true, displayName: true }
                }
            }
        });

        return res.status(200).json(meetings);
    } catch (error) {
        console.error('Error fetching course meetings:', error);
        return res.status(500).json({ error: 'Failed to fetch meeting events.' });
    }
});

// ==========================================
// 3. POST /meetings/:id/availability
// Submit or update personal availability slots for a meeting poll
// ==========================================
router.post('/:id/availability', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const meetingEventId = parseInt(req.params.id as string);
        const { availableSlots } = req.body; // Expecting structured JSON data

        if (isNaN(meetingEventId)) {
            return res.status(400).json({ error: 'Invalid meeting ID format.' });
        }

        if (!availableSlots || typeof availableSlots !== 'object') {
            return res.status(400).json({ error: 'Invalid payload. availableSlots must be a structured JSON object.' });
        }

        // Fetch the target meeting to verify existence and find its associated course
        const meeting = await prisma.meetingEvent.findUnique({
            where: { id: meetingEventId }
        });

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting event not found.' });
        }

        if (meeting.status !== 'open') {
            return res.status(400).json({ error: 'This meeting poll is already closed or finalized.' });
        }

        // Security Check: Verify user belongs to the course where this meeting is hosted
        const isEnrolled = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: userId,
                    courseId: meeting.courseId
                }
            }
        });

        if (!isEnrolled) {
            return res.status(403).json({ error: 'Access denied. You cannot participate in this meeting.' });
        }

        // Transaction: Upsert user availability and ensure they are added to the participant pool
        await prisma.$transaction(async (tx) => {
            // 1. Add to participant list if not already there
            await tx.meetingParticipant.upsert({
                where: {
                    meetingEventId_userId: { meetingEventId, userId }
                },
                update: {},
                create: { meetingEventId, userId }
            });

            // 2. Save the concrete time grid blocks
            await tx.meetingAvailability.upsert({
                where: {
                    meetingEventId_userId: { meetingEventId, userId }
                },
                update: {
                    availableSlots: availableSlots
                },
                create: {
                    meetingEventId,
                    userId,
                    availableSlots: availableSlots
                }
            });
        });

        return res.status(200).json({ message: 'Your availability has been recorded successfully.' });
    } catch (error) {
        console.error('Error saving availability:', error);
        return res.status(500).json({ error: 'Failed to record availability.' });
    }
});

// ==========================================
// 4. GET /meetings/:id/heatmap
// Aggregate all participants' JSON grids to calculate the schedule heatmap
// ==========================================
router.get('/:id/heatmap', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const meetingEventId = parseInt(req.params.id as string);

        if (isNaN(meetingEventId)) {
            return res.status(400).json({ error: 'Invalid meeting ID format.' });
        }

        // Security Check: Check if meeting exists and user has access via course enrollment
        const meeting = await prisma.meetingEvent.findUnique({
            where: { id: meetingEventId }
        });

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting event not found.' });
        }

        const isEnrolled = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: { userId, courseId: meeting.courseId }
            }
        });

        if (!isEnrolled) {
            return res.status(403).json({ error: 'Access denied to this meeting heatmap.' });
        }

        // Query: Fetch all records of user availabilities for this specific meeting
        const records = await prisma.meetingAvailability.findMany({
            where: { meetingEventId: meetingEventId },
            include: {
                user: {
                    select: { id: true, displayName: true }
                }
            }
        });

        // Matrix Aggregation Logic
        // Output Format: Record<string (date), Record<string (timeSlot), { count: number, users: {id: number, name: string}[] }>>
        const heatmap: Record<string, Record<string, { count: number; users: { id: number; name: string }[] }>> = {};

        for (const record of records) {
            const slots = record.availableSlots as Record<string, string[]>;
            if (!slots || typeof slots !== 'object') continue;

            // Iterate dates
            for (const date of Object.keys(slots)) {
                if (!Array.isArray(slots[date])) continue;

                if (!heatmap[date]) {
                    heatmap[date] = {};
                }

                // Iterate specific half-hour blocks or time indicators inside that date
                for (const timeSlot of slots[date]) {
                    if (!heatmap[date][timeSlot]) {
                        heatmap[date][timeSlot] = { count: 0, users: [] };
                    }

                    heatmap[date][timeSlot].count += 1;
                    heatmap[date][timeSlot].users.push({
                        id: record.user.id,
                        name: record.user.displayName
                    });
                }
            }
        }

        return res.status(200).json({
            meetingId: meetingEventId,
            totalRespondents: records.length,
            heatmap: heatmap
        });
    } catch (error) {
        console.error('Error generating heatmap:', error);
        return res.status(500).json({ error: 'Failed to compute schedule heatmap matrix.' });
    }
});

// ==========================================
// 5. POST /meetings/:id/finalize
// Close the poll and lock in the final selection time (Host Only)
// ==========================================
router.post('/:id/finalize', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const meetingEventId = parseInt(req.params.id as string);
        const { finalizedStartTime, finalizedEndTime } = req.body;

        if (isNaN(meetingEventId)) {
            return res.status(400).json({ error: 'Invalid meeting ID format.' });
        }

        if (!finalizedStartTime || !finalizedEndTime) {
            return res.status(400).json({ error: 'Missing finalized start or end time bounds.' });
        }

        const meeting = await prisma.meetingEvent.findUnique({
            where: { id: meetingEventId }
        });

        if (!meeting) {
            return res.status(404).json({ error: 'Meeting event not found.' });
        }

        // Security Check: Only the original creator/host can lock in the finalized time
        if (meeting.creatorId !== userId) {
            return res.status(403).json({ error: 'Access denied. Only the meeting host can finalize the schedule.' });
        }

        // Database Action: Lock schedule and flag status as finalized
        const updatedMeeting = await prisma.meetingEvent.update({
            where: { id: meetingEventId },
            data: {
                finalizedStartTime: new Date(finalizedStartTime),
                finalizedEndTime: new Date(finalizedEndTime),
                status: 'finalized'
            }
        });

        // Find all participants of this meeting
        const participants = await prisma.meetingParticipant.findMany({
            where: { meetingEventId: meetingEventId }
        });

        // Batch create notification data (excluding the host themselves)
        const notificationsData = participants
            .filter(p => p.userId !== userId)
            .map(p => ({
                userId: p.userId,
                type: 'MEETING_FINALIZED',
                content: `Meeting '${meeting.title}' has been finalized!`,
                targetType: 'MEETING',
                targetId: meetingEventId,
                targetUrl: `/courses/${meeting.courseId}/meetings/${meetingEventId}`
            }));

        // Batch insert all notifications at once, which is more efficient than inserting one by one
        if (notificationsData.length > 0) {
            await prisma.notification.createMany({
                data: notificationsData
            });
        }

        return res.status(200).json({
            message: 'Meeting schedule locked and finalized successfully.',
            meeting: updatedMeeting
        });
    } catch (error) {
        console.error('Error finalizing meeting:', error);
        return res.status(500).json({ error: 'Failed to finalize meeting schedule.' });
    }
});

export default router;