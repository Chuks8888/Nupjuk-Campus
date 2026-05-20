import cron from 'node-cron';
import { prisma } from './db';

// Set up a cron job to run every day at 8:00 AM
// This job will check for assignments that are due within the next 24 hours and 
// send notifications to students who haven't marked them as "done"
export const startCronJobs = () => {
    cron.schedule('0 8 * * *', async () => {
        console.log('🤖 Cron Job Started: Checking for upcoming deadlines...');
        try {
            // Find assignments due in the next 24 hours
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            const upcomingAssignments = await prisma.assignment.findMany({
                where: {
                    dueDate: {
                        gte: now,
                        lte: tomorrow
                    }
                }
            });

            for (const assignment of upcomingAssignments) {
                // For each assignment, find enrollments in the course and check their status for this assignment
                const enrollments = await prisma.enrollment.findMany({
                    where: { courseId: assignment.courseId, status: 'active' },
                    include: {
                        user: {
                            include: {
                                assignmentStatuses: {
                                    where: { assignmentId: assignment.id }
                                }
                            }
                        }
                    }
                });

                const notificationsToCreate: any[] = [];

                for (const enrollment of enrollments) {
                    const status = enrollment.user.assignmentStatuses[0];
                    // If no status or status is not "done", prepare to send a notification
                    if (!status || status.userCompletionStatus !== 'done') {
                        notificationsToCreate.push({
                            userId: enrollment.userId,
                            type: 'DEADLINE_REMINDER',
                            content: `Reminder: '${assignment.title}' is due in less than 24 hours!`,
                            targetType: 'ASSIGNMENT',
                            targetId: assignment.id,
                            targetUrl: `/courses/${assignment.courseId}/tasks`
                        });
                    }
                }

                if (notificationsToCreate.length > 0) {
                    await prisma.notification.createMany({ data: notificationsToCreate });
                }
            }
            console.log('Cron Job Finished: Deadline notifications sent.');
        } catch (error) {
            console.error('Cron Job Failed:', error);
        }
    });
};