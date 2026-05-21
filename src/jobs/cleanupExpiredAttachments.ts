import fs from "fs";
import path from "path";
import { prisma } from "../db";

export async function cleanupExpiredAttachments() {
  try {
    const expiredAttachments = await prisma.attachment.findMany({
      where: {
        expiresAt: {
          not: null,
          lte: new Date(),
        },
      },
    });

    for (const attachment of expiredAttachments) {
      if (attachment.storageBackend === "server") {
        const filePath = path.join(
          process.cwd(),
          attachment.fileUrl
        );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await prisma.attachment.delete({
        where: {
          id: attachment.id,
        },
      });
    }

    if (expiredAttachments.length > 0) {
      console.log(
        `Cleaned up ${expiredAttachments.length} expired attachments`
      );
    }
  } catch (error) {
    console.error(
      "Failed to cleanup expired attachments:",
      error
    );
  }
}