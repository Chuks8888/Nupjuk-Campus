import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../src/db";
import { authenticateToken, AuthRequest } from "../src/middleware/auth";

const router = Router();

router.use(authenticateToken);

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const allowedExtensions = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "hwp",
  "hwpx",
  "csv",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "webp",
];

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
      .replace(".", "")
      .toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return cb(new Error("Invalid file type"));
    }

    cb(null, true);
  },
});

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

// POST /attachments/posts/:postId
router.post(
  "/posts/:postId",
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      const postId = Number(req.params.postId);
      const userId = req.user!.userId;

      if (!postId) {
        return res.status(400).json({ error: "postId is required" });
      }

      const hasAccess = await canAccessPost(userId, postId);

      if (!hasAccess) {
        return res.status(403).json({ error: "No access to this post" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "file is required" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      const fileExtension = path.extname(req.file.originalname).replace(".", "");

      const attachment = await prisma.attachment.create({
        data: {
          postId,
          fileName: req.file.originalname,
          fileUrl,
          fileSize: req.file.size,
          fileExtension,
          storageBackend: "server",
          expiresAt: new Date(
            Date.now() + 1000 * 60 * 60 * 24 * 30
          ),
        },
      });

      return res.status(201).json(attachment);
    } catch (error) {
      console.error("Failed to upload attachment:", error);
      return res.status(500).json({ error: "Failed to upload attachment" });
    }
  }
);

// GET /attachments/posts/:postId
router.get("/posts/:postId", async (req: AuthRequest, res: Response) => {
  try {
    const postId = Number(req.params.postId);
    const userId = req.user!.userId;

    if (!postId) {
      return res.status(400).json({ error: "postId is required" });
    }

    const hasAccess = await canAccessPost(userId, postId);

    if (!hasAccess) {
      return res.status(403).json({ error: "No access to this post" });
    }

    const attachments = await prisma.attachment.findMany({
      where: { postId },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    return res.json(attachments);
  } catch (error) {
    console.error("Failed to get attachments:", error);
    return res.status(500).json({ error: "Failed to get attachments" });
  }
});

// DELETE /attachments/:attachmentId
router.delete("/:attachmentId", async (req: AuthRequest, res: Response) => {
  try {
    const attachmentId = Number(req.params.attachmentId);
    const userId = req.user!.userId;

    if (!attachmentId) {
      return res.status(400).json({ error: "attachmentId is required" });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        post: true,
      },
    });

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    const hasAccess = await canAccessPost(userId, attachment.postId);

    if (!hasAccess) {
      return res.status(403).json({ error: "No access to this attachment" });
    }

    if (attachment.post.authorId !== userId) {
      return res.status(403).json({
        error: "Only the post author can delete attachments",
      });
    }

    if (attachment.storageBackend === "server") {
      const filePath = path.join(process.cwd(), attachment.fileUrl);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return res.json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Failed to delete attachment:", error);
    return res.status(500).json({ error: "Failed to delete attachment" });
  }
});

export default router;