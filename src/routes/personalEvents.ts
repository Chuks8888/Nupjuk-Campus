import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);

// GET /personal-events
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const events = await prisma.personalEvent.findMany({
      where: { userId },
      orderBy: { startTime: "asc" },
    });

    return res.json(events);
  } catch (error) {
    console.error("Failed to get personal events:", error);
    return res.status(500).json({ error: "Failed to get personal events" });
  }
});

// POST /personal-events
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title, startTime, endTime, description, status } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({
        error: "title, startTime, and endTime are required",
      });
    }

    const event = await prisma.personalEvent.create({
      data: {
        userId,
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        description,
        status: status || "todo",
      },
    });

    return res.status(201).json(event);
  } catch (error) {
    console.error("Failed to create personal event:", error);
    return res.status(500).json({ error: "Failed to create personal event" });
  }
});

// PATCH /personal-events/:id
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    const { title, startTime, endTime, description, status } = req.body;

    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    const existing = await prisma.personalEvent.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Personal event not found" });
    }

    const updated = await prisma.personalEvent.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(startTime !== undefined && { startTime: new Date(startTime) }),
        ...(endTime !== undefined && { endTime: new Date(endTime) }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Failed to update personal event:", error);
    return res.status(500).json({ error: "Failed to update personal event" });
  }
});

// DELETE /personal-events/:id
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    const existing = await prisma.personalEvent.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Personal event not found" });
    }

    await prisma.personalEvent.delete({
      where: { id },
    });

    return res.json({ message: "Personal event deleted successfully" });
  } catch (error) {
    console.error("Failed to delete personal event:", error);
    return res.status(500).json({ error: "Failed to delete personal event" });
  }
});

export default router;