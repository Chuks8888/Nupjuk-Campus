import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import postsRouter from './posts';

const router = Router();
router.use('/:courseId/posts', postsRouter);

// ==========================================
// 1. GET /courses
// Get all active courses for the currently logged-in user
// ==========================================
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;

        // Query: Find all courses where the user has an active enrollment
        const userCourses = await prisma.course.findMany({
            where: {
                enrollments: {
                    some: {
                        userId: userId,
                        status: "active"
                    }
                }
            },
            // Only select the fields the frontend needs (good practice for performance)
            select: {
                id: true,
                courseCode: true,
                courseName: true,
                semester: true,
                klmsCourseId: true
            }
        });

        return res.status(200).json(userCourses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        return res.status(500).json({ error: 'Failed to fetch courses.' });
    }
});

// ==========================================
// 2. GET /courses/:id
// Get details of a specific course (including its boards)
// ==========================================
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const courseId = parseInt(req.params.id as string);

        if (isNaN(courseId)) {
            return res.status(400).json({ error: 'Invalid course ID format.' });
        }

        // Security: Find the course ONLY IF the current user is enrolled in it
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                enrollments: {
                    some: { userId: userId }
                }
            },
            include: {
                boards: true // Include associated forum boards
            }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found or access denied.' });
        }

        return res.status(200).json(course);
    } catch (error) {
        console.error('Error fetching course details:', error);
        return res.status(500).json({ error: 'Failed to fetch course details.' });
    }
});

// ==========================================
// 3. GET /courses/:id/assignments
// Get all assignments for a specific course, ordered by due date
// ==========================================
router.get('/:id/assignments', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const courseId = parseInt(req.params.id as string);

        if (isNaN(courseId)) {
            return res.status(400).json({ error: 'Invalid course ID format.' });
        }

        // Security Check: Verify the user is actually enrolled in this course first
        const enrollmentCheck = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: userId,
                    courseId: courseId
                }
            }
        });

        if (!enrollmentCheck) {
            return res.status(403).json({ error: 'Access denied. You are not enrolled in this course.' });
        }

        // Query: Get all assignments for the course, including the current user's status for each assignment
        const assignments = await prisma.assignment.findMany({
            where: { courseId: courseId },
            orderBy: { dueDate: 'asc' },
            include: {
                userStatuses: {
                    where: { userId: userId } // Include only the status for the current user
                }
            }
        });

        return res.status(200).json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        return res.status(500).json({ error: 'Failed to fetch assignments.' });
    }
});


// ==========================================
// 4. POST /courses/:courseId/assignments/:assignmentId/status
// Update a user's personal completion status for a specific assignment
// ==========================================
router.post('/:courseId/assignments/:assignmentId/status', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const courseId = parseInt(req.params.courseId as string);
        const assignmentId = parseInt(req.params.assignmentId as string);
        const { userCompletionStatus } = req.body; // Expecting "done", "todo", etc.

        if (isNaN(courseId) || isNaN(assignmentId)) {
            return res.status(400).json({ error: 'Invalid ID format.' });
        }

        if (!userCompletionStatus) {
            return res.status(400).json({ error: 'Missing status field.' });
        }

        // Verify the assignment belongs to the course
        const assignment = await prisma.assignment.findFirst({
            where: { id: assignmentId, courseId: courseId }
        });

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found in this course.' });
        }

        // Upsert the user's personal status
        const updatedStatus = await prisma.userAssignmentStatus.upsert({
            where: {
                userId_assignmentId: { userId: userId, assignmentId: assignmentId }
            },
            update: {
                userCompletionStatus: userCompletionStatus,
                completedAt: userCompletionStatus === 'done' ? new Date() : null
            },
            create: {
                userId: userId,
                assignmentId: assignmentId,
                userCompletionStatus: userCompletionStatus,
                completedAt: userCompletionStatus === 'done' ? new Date() : null
            }
        });

        return res.status(200).json({
            message: 'Assignment status updated successfully',
            status: updatedStatus
        });
    } catch (error) {
        console.error('Error updating assignment status:', error);
        return res.status(500).json({ error: 'Failed to update assignment status.' });
    }
});

// ==========================================
// 5. GET /courses/:id/board-preview
// Allow any email-verified user (even if not enrolled) to view basic course board info (without posts)
// ==========================================
router.get('/:id/board-preview', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const courseId = parseInt(req.params.id as string);

        if (isNaN(courseId)) {
            return res.status(400).json({ error: 'Invalid course ID format.' });
        }

        // We do NOT check enrollment status here, but we also do NOT include any post data
        // in the response, only basic board info. 
        // This allows anyone with a verified email to see the course board structure.
        const courseInfo = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                courseCode: true,
                courseName: true,
                semester: true,
                boards: {
                    select: {
                        id: true,
                        introText: true,
                        createdAt: true
                    }
                }
            }
        });

        if (!courseInfo) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        return res.status(200).json({
            message: "Board preview access granted.",
            course: courseInfo
        });
    } catch (error) {
        console.error('Error fetching board preview:', error);
        return res.status(500).json({ error: 'Failed to fetch board preview.' });
    }
});


export default router;