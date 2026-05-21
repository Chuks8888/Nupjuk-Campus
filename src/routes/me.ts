import express from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.user!.userId,
    },
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
});

export default router;