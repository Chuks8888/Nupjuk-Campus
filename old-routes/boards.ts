import { Router, Response } from "express";
import { prisma } from "../src/db";
import { authenticateToken, AuthRequest } from "../src/middleware/auth";

const router = Router();

router.use(authenticateToken);

async function canAccessBoard(userId: number, boardId: number) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { courseId: true },
  });

  if (!board) {
    return false;
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId: board.courseId,
      status: "active",
      validUntil: {
        gte: new Date(),
      },
    },
  });

  return !!enrollment;
}

async function canAccessPost(userId: number, postId: number) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      boardId: true,
    },
  });

  if (!post) {
    return false;
  }

  return canAccessBoard(userId, post.boardId);
}

// GET /boards/:boardId/posts
router.get("/:boardId/posts", async (req: AuthRequest, res: Response) => {
  try {
    const boardId = Number(req.params.boardId);

    const userId = req.user!.userId;

    const hasAccess = await canAccessBoard(userId, boardId);

    if (!hasAccess) {
      return res.status(403).json({ error: "No access to this board" });
    }

    if (!boardId) {
      return res.status(400).json({ error: "boardId is required" });
    }

    const posts = await prisma.post.findMany({
      where: { boardId },
      include: {
        author: {
          select: {
            id: true,
            kaistEmail: true,
            displayName: true,
          },
        },
        comments: true,
        attachments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(posts);
  } catch (error) {
    console.error("Failed to get board posts:", error);
    return res.status(500).json({ error: "Failed to get board posts" });
  }
});

// POST /boards/:boardId/posts
router.post("/:boardId/posts", async (req: AuthRequest, res: Response) => {
  try {
    const boardId = Number(req.params.boardId);
    const authorId = req.user!.userId;

    const hasAccess = await canAccessBoard(authorId, boardId);

    if (!hasAccess) {
      return res.status(403).json({ error: "No access to this board" });
    }

    const { title, body, category } = req.body;

    if (!boardId || !title || !body) {
      return res.status(400).json({
        error: "boardId, title, and body are required",
      });
    }

    const allowedCategories = [
      "GENERAL",
      "QUESTION",
      "ASSIGNMENT",
      "EXAM",
      "PROJECT"
    ];

    if (category && !allowedCategories.includes(category)) {
      return res.status(400).json({
        error: "Invalid category",
      });
    }

    const post = await prisma.post.create({
      data: {
        boardId,
        authorId,
        title,
        body,
        category,
      },
    });

    return res.status(201).json(post);
  } catch (error) {
    console.error("Failed to create post:", error);
    return res.status(500).json({ error: "Failed to create post" });
  }
});

// GET /boards/posts/:postId
router.get("/posts/:postId", async (req: AuthRequest, res: Response) => {
  try {
    const postId = Number(req.params.postId);

    const userId = req.user!.userId;

    const hasAccess = await canAccessPost(userId, postId);

    if (!hasAccess) {
      return res.status(403).json({ error: "No access to this post" });
    }

    if (!postId) {
      return res.status(400).json({ error: "postId is required" });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            kaistEmail: true,
              displayName: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                kaistEmail: true,
                displayName: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        attachments: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.json(post);
  } catch (error) {
    console.error("Failed to get post:", error);
    return res.status(500).json({ error: "Failed to get post" });
  }
});

// PATCH /boards/posts/:postId
router.patch("/posts/:postId", async (req: AuthRequest, res: Response) => {
  try {
    const postId = Number(req.params.postId);
    const userId = req.user!.userId;

    const hasAccess = await canAccessPost(userId, postId);

    if (!hasAccess) {
      return res.status(403).json({ error: "No access to this post" });
    }

    const { title, body, category } = req.body;

    if (!postId) {
      return res.status(400).json({ error: "postId is required" });
    }

    const allowedCategories = [
      "GENERAL",
      "QUESTION",
      "ASSIGNMENT",
      "EXAM",
      "PROJECT"
    ];

    if (category && !allowedCategories.includes(category)) {
      return res.status(400).json({
        error: "Invalid category",
      });
    }

    const existing = await prisma.post.findFirst({
      where: {
        id: postId,
        authorId: userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Post not found or not yours" });
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        ...(title !== undefined && { title }),
        ...(body !== undefined && { body }),
        ...(category !== undefined && { category }),
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Failed to update post:", error);
    return res.status(500).json({ error: "Failed to update post" });
  }
});

// DELETE /boards/posts/:postId
router.delete("/posts/:postId", async (req: AuthRequest, res: Response) => {
  try {
    const postId = Number(req.params.postId);
    const userId = req.user!.userId;

    const hasAccess = await canAccessPost(userId, postId);

    if (!hasAccess) {
      return res.status(403).json({ error: "No access to this post" });
    }

    if (!postId) {
      return res.status(400).json({ error: "postId is required" });
    }

    const existing = await prisma.post.findFirst({
      where: {
        id: postId,
        authorId: userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Post not found or not yours" });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Failed to delete post:", error);
    return res.status(500).json({ error: "Failed to delete post" });
  }
});

export default router;