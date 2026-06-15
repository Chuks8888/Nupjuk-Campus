import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

// ==========================================
// 1. GET /personal-events
// Fetch all personal events for the logged-in user
// ==========================================
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user!.userId;
      const events = await prisma.personalEvent.findMany({
        where: { userId: userId },
        orderBy: { startTime: "asc" },
      });
      return res.status(200).json(events);
    } catch (error) {
      console.error("Error fetching personal events:", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch personal events." });
    }
  },
);

// ==========================================
// 2. POST /personal-events
// Create a new PersonalEvent (Schedule or Deadline)
// ==========================================
router.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user!.userId;
      const { title, startTime, endTime, description, status } = req.body;

      // // Title and endTime are required; startTime is optional (if not provided, it means this is a deadline).
      if (!title || !endTime) {
        return res
          .status(400)
          .json({ error: "Title and endTime are required." });
      }

      const newEvent = await prisma.personalEvent.create({
        data: {
          userId: userId,
          title: title,
          // If startTime is provided, store the time; if not provided, store as null
          startTime: startTime ? new Date(startTime) : null,
          endTime: new Date(endTime),
          description: description || null,
          status: status || "todo",
        },
      });

      return res
        .status(201)
        .json({ message: "Personal event created.", event: newEvent });
    } catch (error) {
      console.error("Error creating personal event:", error);
      return res
        .status(500)
        .json({ error: "Failed to create personal event." });
    }
  },
);

// ==========================================
// 3. PUT /personal-events/:eventId
// Update an existing PersonalEvent (Schedule or Deadline)
// ==========================================
router.put(
  "/:eventId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user!.userId;
      const eventId = parseInt(req.params.eventId as string);
      const { title, startTime, endTime, description, status } = req.body;

      if (isNaN(eventId))
        return res.status(400).json({ error: "Invalid event ID." });

      const existingEvent = await prisma.personalEvent.findUnique({
        where: { id: eventId },
      });

      if (!existingEvent || existingEvent.userId !== userId) {
        return res
          .status(404)
          .json({ error: "Event not found or access denied." });
      }

      // If startTime is explicitly set to null, it means the user wants to change this to a Deadline, so we store null.
      // If a specific time is provided, we update it.
      // If the field is not provided at all (undefined), we keep the existing value in the database.
      let newStartTime = existingEvent.startTime;
      if (startTime === null) {
        newStartTime = null;
      } else if (startTime) {
        newStartTime = new Date(startTime);
      }

      const updatedEvent = await prisma.personalEvent.update({
        where: { id: eventId },
        data: {
          title: title !== undefined ? title : existingEvent.title,
          startTime: newStartTime,
          endTime: endTime ? new Date(endTime) : existingEvent.endTime,
          description:
            description !== undefined ? description : existingEvent.description,
          status: status !== undefined ? status : existingEvent.status,
        },
      });

      return res
        .status(200)
        .json({ message: "Event updated successfully.", event: updatedEvent });
    } catch (error) {
      console.error("Error updating personal event:", error);
      return res
        .status(500)
        .json({ error: "Failed to update personal event." });
    }
  },
);

// ==========================================
// 4. DELETE /personal-events/:eventId
// Delete a PersonalEvent
// ==========================================
router.delete(
  "/:eventId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const userId = req.user!.userId;
      const eventId = parseInt(req.params.eventId as string);

      if (isNaN(eventId))
        return res.status(400).json({ error: "Invalid event ID." });

      const existingEvent = await prisma.personalEvent.findUnique({
        where: { id: eventId },
      });

      if (!existingEvent || existingEvent.userId !== userId) {
        return res
          .status(404)
          .json({ error: "Event not found or access denied." });
      }

      await prisma.personalEvent.delete({ where: { id: eventId } });
      return res.status(200).json({ message: "Event deleted successfully." });
    } catch (error) {
      console.error("Error deleting personal event:", error);
      return res
        .status(500)
        .json({ error: "Failed to delete personal event." });
    }
  },
);

export default router;
