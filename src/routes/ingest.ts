import express from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();
function getSemesterEndDate(semester: string): Date {
  const [yearStr, term] = semester.split(" ");

  const year = parseInt(yearStr);

  if (term === "Spring") {
    return new Date(`${year}-06-30T23:59:59`);
  }

  if (term === "Fall") {
    return new Date(`${year + 1}-01-31T23:59:59`);
  }

  return new Date(`${year}-12-31T23:59:59`);
}

router.post("/profile", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { displayName, studentId } = req.body;

    await prisma.user.update({
      where: {
        id: req.user!.userId,
      },
      data: {
        displayName,
        studentId,
      },
    });

    return res.json({ message: "Profile ingested successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to ingest profile" });
  }
});

// Course Check
// Drop: inactive enrollment
// Enrollment existing: active / Create new enrollment

router.post("/courses", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { courses, semester } = req.body;
    const userId = req.user!.userId;

    if (!courses || !Array.isArray(courses)) {
      return res.status(400).json({ error: "Invalid courses data" });
    }

    if (courses.length === 0) {
      return res.json({
        message: "No courses found; skipped enrollment update",
      });
    }

    const seenCourseIds: number[] = [];

    for (const course of courses) {
      if (!course.klmsCourseId) {
        continue;
      }

      const dbCourse = await prisma.course.upsert({
        where: {
          klmsCourseId: course.klmsCourseId,
        },
        update: {
          courseCode: course.courseCode,
          courseName: course.courseName,
          semester: course.semester || semester,
        },
        create: {
          courseCode: course.courseCode,
          courseName: course.courseName,
          semester: course.semester || semester,
          klmsCourseId: course.klmsCourseId,
        },
      });

      seenCourseIds.push(dbCourse.id);

      await prisma.board.upsert({
        where: {
          courseId: dbCourse.id,
        },
        update: {},
        create: {
          courseId: dbCourse.id,
          introText: `${course.courseName} discussion board`,
        },
      });

      await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId: dbCourse.id,
          },
        },
        update: {
          verifiedAt: new Date(),
          status: "active",
          validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
        },
        create: {
          userId,
          courseId: dbCourse.id,
          verifiedAt: new Date(),
          validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
          status: "active",
          role: "student",
        },
      });
    }

    await prisma.enrollment.updateMany({
      where: {
        userId,
        courseId: {
          notIn: seenCourseIds,
        },
        status: "active",
      },
      data: {
        status: "inactive",
        validUntil: new Date(),
      },
    });

    return res.json({
      message: "Courses ingested successfully",
      activeCourseCount: seenCourseIds.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to ingest courses" });
  }
});

// Assignment Check
// Still in KLMS to-do list: not_submitted
// Missing from KLMS to-do list: unknown; do not mark as submitted automatically.
// KLMS may hide overdue assignments from the homepage to-do list.

router.post("/assignments", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { assignments, semester } = req.body;
    const userId = req.user!.userId;

    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ error: "Invalid assignments data" });
    }

    if (assignments.length === 0) {
      return res.json({
        message: "No assignments found; skipped assignment status update",
      });
    }

    const seenAssignmentIdsByCourse = new Map<number, number[]>();
    const touchedCourseIds = new Set<number>();

    for (const assignment of assignments) {
      console.log("assignment courseName:", assignment.courseName);
      console.log("semester:", semester);
      console.log("before course find");
      const course = await prisma.course.findFirst({
        where: {
          courseName: assignment.courseName,
          semester,
        },
      });

      if (!course) {
        continue;
      }

      touchedCourseIds.add(course.id);

      const klmsAssignmentId =
        assignment.klmsAssignmentId ||
        assignment.assignmentUrl?.match(/[?&]id=([^&]+)/)?.[1] ||
        assignment.assignmentUrl;

      if (!klmsAssignmentId || !assignment.assignmentUrl) {
        continue;
      }

      console.log("before assignment write");
      console.log("assignment payload:", assignment);

      const existingAssignment = await prisma.assignment.findUnique({
        where: {
          assignmentUrl: assignment.assignmentUrl,
        },
      });

      const normalizedDueDate = assignment.dueDate
        ? new Date(`${assignment.dueDate}T23:59:00+09:00`)
        : null;

      let dbAssignment = existingAssignment;

      if (!dbAssignment) {
        console.log("creating new assignment");

        dbAssignment = await prisma.assignment.create({
          data: {
            courseId: course.id,
            klmsAssignmentId,
            title: assignment.title,
            dueDate: normalizedDueDate,
            description: assignment.description || null,
            assignmentUrl: assignment.assignmentUrl,
            source: assignment.source || "klms_synced",
          },
        });
      } else {
        console.log("assignment already exists");
      }

      if (!seenAssignmentIdsByCourse.has(course.id)) {
        seenAssignmentIdsByCourse.set(course.id, []);
      }

      seenAssignmentIdsByCourse.get(course.id)!.push(dbAssignment.id);

      console.log("before status upsert");

      await prisma.userAssignmentStatus.upsert({
        where: {
          userId_assignmentId: {
            userId,
            assignmentId: dbAssignment.id,
          },
        },
        update: {
          klmsSubmissionStatus: "not_submitted",
        },
        create: {
          userId,
          assignmentId: dbAssignment.id,
          klmsSubmissionStatus: "not_submitted",
        },
      });
    }

    // console.log("before missing status update");

    // const activeEnrollments = await prisma.enrollment.findMany({
    //   where: {
    //     userId,
    //     status: "active",
    //   },
    //   select: {
    //     courseId: true,
    //   },
    // });

    // for (const enrollment of activeEnrollments) {
    //   const courseId = enrollment.courseId;
    //   const seenAssignmentIds = seenAssignmentIdsByCourse.get(courseId) || [];

    //   const oldNotSubmittedStatuses = await prisma.userAssignmentStatus.findMany({
    //     where: {
    //       userId,
    //       klmsSubmissionStatus: "not_submitted",
    //       assignment: {
    //         courseId,
    //       },
    //     },
    //     select: {
    //       id: true,
    //       assignmentId: true,
    //     },
    //   });

    //   for (const status of oldNotSubmittedStatuses) {
    //     if (seenAssignmentIds.includes(status.assignmentId)) {
    //       continue;
    //     }

    //     await prisma.userAssignmentStatus.update({
    //       where: {
    //         id: status.id,
    //       },
    //       data: {
    //         klmsSubmissionStatus: "submitted",
    //       },
    //     });
    //   }
    // }

    console.log("skipping missing assignment status update");

    return res.json({
      message: "Assignments ingested successfully",
      touchedCourseCount: touchedCourseIds.size,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to ingest assignments" });
  }
});

router.get("/tracked-assignments", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const assignments = await prisma.assignment.findMany({
      where: {
        source: "klms_synced",
        course: {
          enrollments: {
            some: {
              userId,
              status: "active",
            },
          },
        },
      },
      include: {
        course: true,
        userStatuses: {
          where: {
            userId,
          },
        },
      },
    });

    return res.json({
      assignments: assignments.map((assignment: any) => ({
        assignmentId: assignment.id,
        title: assignment.title,
        assignmentUrl: assignment.assignmentUrl,
        dueDate: assignment.dueDate,
        courseName: assignment.course.courseName,
        semester: assignment.course.semester,
        klmsSubmissionStatus:
          assignment.userStatuses[0]?.klmsSubmissionStatus ?? "not_submitted",
        klmsTimingStatus:
          assignment.userStatuses[0]?.klmsTimingStatus ?? "on_time",
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch tracked assignments" });
  }
});

router.post("/assignment-statuses", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { statuses } = req.body;

    if (!Array.isArray(statuses)) {
      return res.status(400).json({ error: "Invalid statuses data" });
    }

    const allowedSubmissionStatuses = ["not_submitted", "submitted"];
    const allowedTimingStatuses = ["on_time", "overdue", "late_submitted"];

    const updated = [];

    for (const status of statuses) {
      const {
        assignmentId,
        klmsSubmissionStatus,
        klmsTimingStatus = "on_time",
        dueDate,
      } = status;

      if (!assignmentId || !klmsSubmissionStatus) {
        continue;
      }

      if (!allowedSubmissionStatuses.includes(klmsSubmissionStatus)) {
        continue;
      }

      if (!allowedTimingStatuses.includes(klmsTimingStatus)) {
        continue;
      }

      const updatedStatus = await prisma.userAssignmentStatus.upsert({
        where: {
          userId_assignmentId: {
            userId,
            assignmentId,
          },
        },
        update: {
          klmsSubmissionStatus,
          klmsTimingStatus,
        },
        create: {
          userId,
          assignmentId,
          klmsSubmissionStatus,
          klmsTimingStatus,
        },
      });

      if (dueDate) {
        await prisma.assignment.update({
          where: {
            id: assignmentId,
          },
          data: {
            dueDate: new Date(dueDate),
          },
        });
      }

      updated.push({
        assignmentId,
        klmsSubmissionStatus,
        klmsTimingStatus,
        statusId: updatedStatus.id,
      });
    }

    return res.json({
      message: "Assignment statuses updated successfully",
      updated,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update assignment statuses" });
  }
});

export default router;