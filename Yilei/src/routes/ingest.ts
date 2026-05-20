import express from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();
function getSemesterEndDate(semester: string): Date {
  const [yearStr, term] = semester.split(" ");

  const year = parseInt(yearStr!);

  if (term === "Spring") {
    return new Date(`${year}-06-30T23:59:59`);
  }

  if (term === "Fall") {
    return new Date(`${year + 1}-01-31T23:59:59`);
  }

  return new Date(`${year}-12-31T23:59:59`);
}

router.post("/courses", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { courses } = req.body;

    if (!courses || !Array.isArray(courses)) {
      return res.status(400).json({ error: "Invalid courses data" });
    }

    for (const course of courses) {

      const now = new Date();
      const validUntil = getSemesterEndDate(course.semester);

      let existingCourse = await prisma.course.findUnique({
        where: {
          klmsCourseId: course.klmsCourseId,
        },
      });

      if (!existingCourse) {
        existingCourse = await prisma.course.create({
          data: {
            courseCode: course.courseCode,
            courseName: course.courseName,
            semester: course.semester,
            klmsCourseId: course.klmsCourseId,
          },
        });
      }

      await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: req.user!.userId,
            courseId: existingCourse.id,
          },
        },

        update: {
          verifiedAt: now,
          validUntil,
          status: "active",
        },

        create: {
          userId: req.user!.userId,
          courseId: existingCourse.id,
          verifiedAt: now,
          validUntil,
          status: "active",
        },
      });
    }

    return res.json({
      message: "Courses ingested successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to ingest courses" });
  }
});

export default router;