import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

async function canAccessPost(userId: number, postId: number) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      board: {
        select: {
          courseId: true,
        },
      },
    },
  });

  if (!post) {
    return false;
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId: post.board.courseId,
      status: "active",
      validUntil: {
        gte: new Date(),
      },
    },
  });

  return !!enrollment;
}

router.use(authenticateToken);

// POST /comments/posts/:postId
router.post("/posts/:postId", async (req: AuthRequest, res: Response) => {
  try {
    const postId = Number(req.params.postId);
    const authorId = req.user!.userId;
    const { body } = req.body;

    if (!postId || !body) {
      return res.status(400).json({ error: "postId and body are required" });
    }

    const hasAccess = await canAccessPost(authorId, postId);

    if (!hasAccess) {
    return res.status(403).json({ error: "No access to this post" });
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId,
        body,
      },
    });

    return res.status(201).json(comment);
  } catch (error) {
    console.error("Failed to create comment:", error);
    return res.status(500).json({ error: "Failed to create comment" });
  }
});

// PATCH /comments/:commentId
router.patch("/:commentId", async (req: AuthRequest, res: Response) => {
  try {
    const commentId = Number(req.params.commentId);
    const userId = req.user!.userId;
    const { body } = req.body;

    if (!commentId || !body) {
      return res.status(400).json({ error: "commentId and body are required" });
    }

    const existing = await prisma.comment.findFirst({
      where: {
        id: commentId,
        authorId: userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Comment not found or not yours" });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { body },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Failed to update comment:", error);
    return res.status(500).json({ error: "Failed to update comment" });
  }
});

// DELETE /comments/:commentId
router.delete("/:commentId", async (req: AuthRequest, res: Response) => {
  try {
    const commentId = Number(req.params.commentId);
    const userId = req.user!.userId;

    if (!commentId) {
      return res.status(400).json({ error: "commentId is required" });
    }

    const existing = await prisma.comment.findFirst({
      where: {
        id: commentId,
        authorId: userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Comment not found or not yours" });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;