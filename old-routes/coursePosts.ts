import { Router, Response } from "express";
import { prisma } from "../src/db";
import { authenticateToken, AuthRequest } from "../src/middleware/auth";

const router = Router({ mergeParams: true });

async function verifyAccessAndGetBoard(userId: number, courseId: number) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (!enrollment || enrollment.status !== "active") {
    return {
      error: "Access denied. You are not enrolled in this course.",
      status: 403,
    };
  }

  const board = await prisma.board.upsert({
    where: { courseId },
    update: {},
    create: { courseId },
  });

  return { board, status: 200 };
}

router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const courseId = Number(req.params.courseId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;

    if (!courseId || page < 1 || limit < 1) {
      return res.status(400).json({ error: "Invalid course ID or pagination parameters." });
    }

    const access = await verifyAccessAndGetBoard(userId, courseId);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    const whereClause: any = { boardId: access.board!.id };
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [posts, totalCount] = await prisma.$transaction([
      prisma.post.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, displayName: true, kaistEmail: true } },
          _count: { select: { comments: true, attachments: true } },
        },
      }),
      prisma.post.count({ where: whereClause }),
    ]);

    return res.json({
      data: posts,
      meta: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ error: "Failed to fetch posts." });
  }
});

router.get("/:postId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const courseId = Number(req.params.courseId);
    const postId = Number(req.params.postId);

    if (!courseId || !postId) {
      return res.status(400).json({ error: "Invalid ID format." });
    }

    const access = await verifyAccessAndGetBoard(userId, courseId);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        boardId: access.board!.id,
      },
      include: {
        author: { select: { id: true, displayName: true, kaistEmail: true } },
        attachments: true,
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, displayName: true, kaistEmail: true } },
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    return res.json(post);
  } catch (error) {
    console.error("Error fetching post details:", error);
    return res.status(500).json({ error: "Failed to fetch post details." });
  }
});

router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const courseId = Number(req.params.courseId);
    const { title, body, category } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: "Invalid course ID." });
    }

    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required." });
    }

    const access = await verifyAccessAndGetBoard(userId, courseId);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    const post = await prisma.post.create({
      data: {
        boardId: access.board!.id,
        authorId: userId,
        title,
        body,
        category: category || "GENERAL",
      },
    });

    return res.status(201).json({ message: "Post created successfully.", post });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({ error: "Failed to create post." });
  }
});

router.post("/:postId/comments", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const courseId = Number(req.params.courseId);
    const postId = Number(req.params.postId);
    const { body } = req.body;

    if (!courseId || !postId) {
      return res.status(400).json({ error: "Invalid ID format." });
    }

    if (!body) {
      return res.status(400).json({ error: "Comment body is required." });
    }

    const access = await verifyAccessAndGetBoard(userId, courseId);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    const post = await prisma.post.findFirst({
      where: { id: postId, boardId: access.board!.id },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found in this course board." });
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        body,
      },
    });

    if (post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: "NEW_COMMENT",
          content: `Someone commented on your post: ${post.title}`,
          targetType: "POST",
          targetId: postId,
          targetUrl: `/courses/${courseId}/posts/${postId}`,
        },
      });
    }

    return res.status(201).json({ message: "Comment added successfully.", comment });
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({ error: "Failed to add comment." });
  }
});

export default router;
