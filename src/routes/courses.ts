import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import coursePostsRouter from "./coursePosts";

const router = Router();

router.use("/:courseId/posts", coursePostsRouter);

router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const courses = await prisma.course.findMany({
      where: {
        enrollments: {
          some: {
            userId,
            status: "active",
          },
        },
      },
      select: {
        id: true,
        courseCode: true,
        courseName: true,
        semester: true,
        klmsCourseId: true,
        boards: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            assignments: true,
            enrollments: true,
          },
        },
      },
      orderBy: {
        courseCode: "asc",
      },
    });

    return res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return res.status(500).json({ error: "Failed to fetch courses." });
  }
});

router.get("/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const courseId = Number(req.params.id);

    if (!courseId) {
      return res.status(400).json({ error: "Invalid course ID format." });
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        enrollments: {
          some: { userId, status: "active" },
        },
      },
      include: {
        boards: true,
        _count: {
          select: {
            assignments: true,
            enrollments: true,
            meetings: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found or access denied." });
    }

    return res.json(course);
  } catch (error) {
    console.error("Error fetching course details:", error);
    return res.status(500).json({ error: "Failed to fetch course details." });
  }
});

router.get("/:id/assignments", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const courseId = Number(req.params.id);

    if (!courseId) {
      return res.status(400).json({ error: "Invalid course ID format." });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment || enrollment.status !== "active") {
      return res.status(403).json({ error: "Access denied. You are not enrolled in this course." });
    }

    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      orderBy: { dueDate: "asc" },
      include: {
        course: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
          },
        },
        userStatuses: {
          where: { userId },
        },
      },
    });

    return res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return res.status(500).json({ error: "Failed to fetch assignments." });
  }
});

router.post("/:courseId/assignments/:assignmentId/status", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const courseId = Number(req.params.courseId);
    const assignmentId = Number(req.params.assignmentId);
    const { userCompletionStatus } = req.body;

    if (!courseId || !assignmentId) {
      return res.status(400).json({ error: "Invalid ID format." });
    }

    if (!userCompletionStatus) {
      return res.status(400).json({ error: "Missing status field." });
    }

    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, courseId },
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found in this course." });
    }

    const status = await prisma.userAssignmentStatus.upsert({
      where: {
        userId_assignmentId: { userId, assignmentId },
      },
      update: {
        userCompletionStatus,
        completedAt: userCompletionStatus === "done" || userCompletionStatus === "completed" ? new Date() : null,
      },
      create: {
        userId,
        assignmentId,
        userCompletionStatus,
        completedAt: userCompletionStatus === "done" || userCompletionStatus === "completed" ? new Date() : null,
      },
    });

    return res.json({
      message: "Assignment status updated successfully",
      status,
    });
  } catch (error) {
    console.error("Error updating assignment status:", error);
    return res.status(500).json({ error: "Failed to update assignment status." });
  }
});

export default router;
