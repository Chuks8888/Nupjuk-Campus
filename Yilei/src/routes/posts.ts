import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload'; 
import fs from 'fs';
import path from 'path';
import { transporter } from '../mail';

// Initialize router with mergeParams to access :courseId from the parent router
const router = Router({ mergeParams: true });

const VALID_CATEGORIES = ['GENERAL', 'QUESTION', 'ASSIGNMENT', 'EXAM', 'PROJECT'];

// Helper function to verify enrollment and get/create the board
async function verifyAccessAndGetBoard(userId: number, courseId: number) {
    // Check if the user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } }
    });

    if (!enrollment || enrollment.status !== 'active') {
        return { error: 'Access denied. You must be actively enrolled in this course.', status: 403 };
    }

    // Automatically find or create the board for this course
    const board = await prisma.board.upsert({
        where: { courseId: courseId },
        update: {},
        create: { courseId: courseId }
    });

    return { board, status: 200 };
}

// ==========================================
// 1. GET /courses/:courseId/posts
// Fetch all posts with Pagination and Search
// ==========================================
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const courseId = parseInt(req.params.courseId as string);
        
        // Extract pagination parameters with defaults: page 1, limit 20
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;

        if (isNaN(courseId) || page < 1 || limit < 1) {
            return res.status(400).json({ error: 'Invalid course ID or pagination parameters.' });
        }

        const access = await verifyAccessAndGetBoard(userId, courseId);
        if (access.error) return res.status(access.status).json({ error: access.error });

        // The post must belong to the board of the course
        const whereClause: any = { boardId: access.board!.id };
        
        // If a search term is provided, add a case-insensitive search condition on title and body
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { body: { contains: search, mode: 'insensitive' } },
                { author: { displayName: { contains: search, mode: 'insensitive' } } }
            ];
        }

        // Calculate the number of records to skip based on the current page and limit
        const skip = (page - 1) * limit;
        const [posts, totalCount] = await prisma.$transaction([
            prisma.post.findMany({
                where: whereClause,
                skip: skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: { select: { id: true, displayName: true } },
                    _count: { select: { comments: true } }
                }
            }),
            prisma.post.count({ where: whereClause })
        ]);

        return res.status(200).json({
            data: posts,
            meta: {
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({ error: 'Failed to fetch posts.' });
    }
});

// ==========================================
// 2. GET /courses/:courseId/posts/:postId
// Fetch a single post with its comments and attachments
// ==========================================
router.get('/:postId', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const courseId = parseInt(req.params.courseId as string);
        const postId = parseInt(req.params.postId as string);

        if (isNaN(courseId) || isNaN(postId)) {
            return res.status(400).json({ error: 'Invalid ID format.' });
        }

        const access = await verifyAccessAndGetBoard(userId, courseId);
        if (access.error) return res.status(access.status).json({ error: access.error });

        const post = await prisma.post.findFirst({
            where: { 
                id: postId,
                boardId: access.board!.id 
            },
            include: {
                author: { select: { id: true, displayName: true } },
                attachments: true,
                comments: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        author: { select: { id: true, displayName: true } }
                    }
                }
            }
        });

        if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        return res.status(200).json(post);
    } catch (error) {
        console.error('Error fetching post details:', error);
        return res.status(500).json({ error: 'Failed to fetch post details.' });
    }
});

// ==========================================
// 3. POST /courses/:courseId/posts
// Create a new post in the course board (with optional attachments)
// Attachments are uploaded using multipart/form-data with the field name 'attachments' (up to 5 files)
// ==========================================
router.post('/', authenticateToken, upload.array('attachments', 5), async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const courseId = parseInt(req.params.courseId as string);
        const { title, body, category } = req.body;

        if (isNaN(courseId)) {
            return res.status(400).json({ error: 'Invalid course ID.' });
        }

        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required.' });
        }

        if (category && !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ 
                error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` 
            });
        }

        const access = await verifyAccessAndGetBoard(userId, courseId);
        if (access.error) return res.status(access.status).json({ error: access.error });

        // 1. First, create the post in the database to get the postId
        const newPost = await prisma.post.create({
            data: {
                boardId: access.board!.id,
                authorId: userId,
                title: title,
                body: body,
                category: category || 'GENERAL'
            }
        });

        // 2. If files are uploaded, write their metadata into the Attachment table, 
        // linking them to the newly created post
        const files = req.files as Express.Multer.File[];
        if (files && files.length > 0) {
            const attachmentData = files.map(file => ({
                postId: newPost.id,               // Link to the newly created post
                fileName: file.originalname,
                fileUrl: `/uploads/${file.filename}`, // Map to the static directory defined in index.ts
                fileSize: file.size,
                fileExtension: path.extname(file.originalname).toLowerCase(),
                storageBackend: 'server'
            }));

            // Batch write attachment records
            await prisma.attachment.createMany({ data: attachmentData });
        }

        // 3. Return the complete post with attachment information to the frontend
        const postWithAttachments = await prisma.post.findUnique({
            where: { id: newPost.id },
            include: { attachments: true }
        });

        return res.status(201).json({ message: 'Post created successfully.', post: postWithAttachments });
    } catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ error: 'Failed to create post.' });
    }
});
// ==========================================
// 4. POST /courses/:courseId/posts/:postId/comments
// Add a comment to a specific post
// ==========================================
router.post('/:postId/comments', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const courseId = parseInt(req.params.courseId as string);
        const postId = parseInt(req.params.postId as string);
        const { body } = req.body;

        if (isNaN(courseId) || isNaN(postId)) {
            return res.status(400).json({ error: 'Invalid ID format.' });
        }

        if (!body) {
            return res.status(400).json({ error: 'Comment body is required.' });
        }

        const access = await verifyAccessAndGetBoard(userId, courseId);
        if (access.error) return res.status(access.status).json({ error: access.error });

        // Verify the post exists and belongs to this board
        const postExists = await prisma.post.findFirst({
            where: { id: postId, boardId: access.board!.id }
        });

        if (!postExists) {
            return res.status(404).json({ error: 'Post not found in this course board.' });
        }

        const newComment = await prisma.comment.create({
            data: {
                postId: postId,
                authorId: userId,
                body: body
            }
        });

        // If commenter is not the post author, send a notification to the author
        // Check the author's notification preferences before sending
        if (postExists.authorId !== userId) {
            // 1. First, check if the post author has course-specific notification preferences for this course (courseId)
            let pref = await prisma.notificationPreference.findFirst({
                where: { userId: postExists.authorId, courseId: courseId }
            });

            // 2. If no course-specific setting is found, check for the user's global setting (courseId: null)
            if (!pref) {
                pref = await prisma.notificationPreference.findFirst({
                    where: { userId: postExists.authorId, courseId: null }
                });
            }

            // 3. According to the schema, if no setting is found, the default should be true
            const shouldNotify = pref ? pref.postCommentEnabled : true;

            // If the author has enabled comment notifications, proceed with the notification logic
            if (shouldNotify) {
                // Store the notification in the database for the post author
                const createdNotification = await prisma.notification.create({
                    data: {
                        userId: postExists.authorId,
                        type: 'NEW_COMMENT',
                        content: `Someone commented on your post: ${postExists.title}`,
                        targetType: 'POST',
                        targetId: postId,
                        targetUrl: `/courses/${courseId}/posts/${postId}`
                    }
                });

                // WebSocket real-time notification logic
                // Get the global Socket.IO instance and emit a notification to the specific room for the post author
                const io = req.app.get('io');
                if (io) {
                    io.to(`user_${postExists.authorId}`).emit('new_notification', createdNotification);
                }

                // Email notification logic: Check if the user has enabled email notifications for comments
                const emailEnabled = pref ? pref.emailEnabled : false;
                if (emailEnabled) {
                    // Find the author's email and display name for sending the email notification
                    const author = await prisma.user.findUnique({
                        where: { id: postExists.authorId },
                        select: { kaistEmail: true, displayName: true }
                    });

                    if (author && author.kaistEmail) {
                        const subject = `[Nupjuk Campus] New Comment on your post: ${postExists.title}`;

                        // Later, change the yourdomain.com to the actual domain
                        const text = `Hello ${author.displayName || 'User'},\n\nSomeone just commented on your post "
                        ${postExists.title}".\n\nYou can view the discussion here:\nhttps://yourdomain.com/courses/${courseId}/posts/${postId}\n\nBest,\nNupjuk Campus Team`;
                        
                        // Trigger the actual sending of the email
                        await transporter.sendMail({
                            from: process.env.EMAIL_USER,
                            to: author.kaistEmail,
                            subject: subject,
                            text: text
                        });
                    
                        console.log(`[Email] Sent to ${author.kaistEmail} about new comment.`);
                    }
                }
            }
        }

        return res.status(201).json({ message: 'Comment added successfully.', comment: newComment });
    } catch (error) {
        console.error('Error adding comment:', error);
        return res.status(500).json({ error: 'Failed to add comment.' });
    }
});

// ==========================================
// 5. DELETE /courses/:courseId/posts/:postId
// Delete a post (only author can delete)
// ==========================================
router.delete('/:postId', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const courseId = parseInt(req.params.courseId as string);
        const postId = parseInt(req.params.postId as string);

        if (isNaN(courseId) || isNaN(postId)) {
            return res.status(400).json({ error: 'Invalid ID format.' });
        }

        const access = await verifyAccessAndGetBoard(userId, courseId);
        if (access.error) return res.status(access.status).json({ error: access.error });

        const post = await prisma.post.findUnique({ 
            where: { id: postId },
            include: { attachments: true } 
        });


        if (!post || post.boardId !== access.board!.id) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        if (post.authorId !== userId) {
            return res.status(403).json({ error: 'Access denied. You can only delete your own posts.' });
        }

        // Traverse and delete files on the disk
        if (post.attachments && post.attachments.length > 0) {
            post.attachments.forEach(file => {
                const filePath = path.join(__dirname, '../../', file.fileUrl);
                // Check if the file exists, if it does, delete it from the server
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }


        // Transaction to delete associated comments and the post itself
        await prisma.$transaction([
            prisma.comment.deleteMany({ where: { postId: postId } }),
            prisma.attachment.deleteMany({ where: { postId: postId } }),
            prisma.post.delete({ where: { id: postId } })
        ]);

        return res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ error: 'Failed to delete post.' });
    }
});

// ==========================================
// 6. PUT /courses/:courseId/posts/:postId
// Update an existing post (only author can update)
// ==========================================
router.put('/:postId', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const courseId = parseInt(req.params.courseId as string);
        const postId = parseInt(req.params.postId as string);
        const { title, body, category } = req.body;

        if (isNaN(courseId) || isNaN(postId)) {
            return res.status(400).json({ error: 'Invalid ID format.' });
        }

        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required for updating.' });
        }

        // If a category is provided, validate it against the allowed categories
        if (category && !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ 
                error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` 
            });
        }

        const access = await verifyAccessAndGetBoard(userId, courseId);
        if (access.error) return res.status(access.status).json({ error: access.error });

        const existingPost = await prisma.post.findUnique({ where: { id: postId } });

        if (!existingPost || existingPost.boardId !== access.board!.id) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        if (existingPost.authorId !== userId) {
            return res.status(403).json({ error: 'Access denied. You can only edit your own posts.' });
        }

        // Update post
        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: { 
                title, 
                body, 
                // If category is not provided, keep the existing category instead of setting it to null
                category: category || existingPost.category 
            }
        });

        return res.status(200).json({ message: 'Post updated successfully.', post: updatedPost });
    } catch (error) {
        console.error('Error updating post:', error);
        return res.status(500).json({ error: 'Failed to update post.' });
    }
});

// ==========================================
// 7. DELETE /courses/:courseId/posts/:postId/comments/:commentId
// Delete a specific comment (only author can delete)
// ==========================================
router.delete('/:postId/comments/:commentId', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const courseId = parseInt(req.params.courseId as string);
        const postId = parseInt(req.params.postId as string);
        const commentId = parseInt(req.params.commentId as string);

        if (isNaN(courseId) || isNaN(postId) || isNaN(commentId)) {
            return res.status(400).json({ error: 'Invalid ID format.' });
        }

        const access = await verifyAccessAndGetBoard(userId, courseId);
        if (access.error) return res.status(access.status).json({ error: access.error });

        // Verify comment exists, belongs to the correct post, and belongs to the author
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });

        if (!comment || comment.postId !== postId) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        if (comment.authorId !== userId) {
            return res.status(403).json({ error: 'Access denied. You can only delete your own comments.' });
        }

        await prisma.comment.delete({ where: { id: commentId } });

        return res.status(200).json({ message: 'Comment deleted successfully.' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ error: 'Failed to delete comment.' });
    }
});

// ==========================================
// 8. PUT /courses/:courseId/posts/:postId/comments/:commentId
// Update a specific comment (only author can update)
// ==========================================
router.put('/:postId/comments/:commentId', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!.userId;
        const courseId = parseInt(req.params.courseId as string);
        const postId = parseInt(req.params.postId as string);
        const commentId = parseInt(req.params.commentId as string);
        const { body } = req.body;

        if (isNaN(courseId) || isNaN(postId) || isNaN(commentId)) {
            return res.status(400).json({ error: 'Invalid ID format.' });
        }

        if (!body) {
            return res.status(400).json({ error: 'Comment body is required for updating.' });
        }

        const access = await verifyAccessAndGetBoard(userId, courseId);
        if (access.error) return res.status(access.status).json({ error: access.error });

        // Verify comment exists, belongs to the correct post, and belongs to the author
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });

        if (!comment || comment.postId !== postId) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        if (comment.authorId !== userId) {
            return res.status(403).json({ error: 'Access denied. You can only edit your own comments.' });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { body }
        });

        return res.status(200).json({ message: 'Comment updated successfully.', comment: updatedComment });
    } catch (error) {
        console.error('Error updating comment:', error);
        return res.status(500).json({ error: 'Failed to update comment.' });
    }
});

export default router;