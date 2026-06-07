import cron from 'node-cron';
import { prisma } from './db';
import { transporter } from './mail';

// The function calculates an exact 1-minute window for a given number of hours ahead, 
// ensuring that we only target events that are due in that specific minute
function getExactMinuteWindow(hoursAhead: number) {
    const now = new Date();
    const targetTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    // We create a window that starts at the exact minute (with seconds set to 0) 
    // and ends at the end of that minute (with seconds set to 59.999)
    const windowStart = new Date(targetTime);
    windowStart.setSeconds(0, 0);

    const windowEnd = new Date(targetTime);
    windowEnd.setSeconds(59, 999);

    return { gte: windowStart, lte: windowEnd };
}

export const startCronJobs = (io: any) => {
    // for each run, we check for events that are due in exactly 24 hours and 3 hours, 
    // with a precise 1-minute window to ensure timely notifications.
    cron.schedule('* * * * *', async () => {
        try {
            const notificationsToCreate: any[] = [];

            // A queue specifically used for storing emails to be sent
            const emailsToSend: { to: string; subject: string; text: string }[] = [];

            // Define the time windows we want to check for: 24 hours and 3 hours before the deadline
            const windows = [
                { hours: 24, label: "1 day" },
                { hours: 3, label: "3 hours" }
            ];

            for (const window of windows) {
                // This ensures that we only target events that are due in that specific minute, 
                // avoiding duplicates and ensuring timely reminders.
                const exactTimeFilter = getExactMinuteWindow(window.hours);

                // ==================================================
                // 1. Only target assignments that are due in the exact minute window 
                // ==================================================
                const upcomingAssignments = await prisma.assignment.findMany({
                    where: { dueDate: exactTimeFilter },
                    include: { course: true }
                });

                for (const assignment of upcomingAssignments) {
                    const enrollments = await prisma.enrollment.findMany({
                        where: { courseId: assignment.courseId, status: 'active' },
                        include: {
                            user: {
                                include: {
                                    assignmentStatuses: { where: { assignmentId: assignment.id } },
                                    notificationPreferences: { where: { courseId: assignment.courseId } }
                                }
                            }
                        }
                    });

                    for (const enrollment of enrollments) {
                        const status = enrollment.user.assignmentStatuses[0];
                        const prefs = enrollment.user.notificationPreferences[0];

                        // if the user has disabled deadline reminders for this course, we skip 
                        // sending the notification, even if the assignment is due soon.
                        if (prefs && prefs.deadlineEnabled === false) continue;

                        if (!status || status.userCompletionStatus !== 'done') {
                            notificationsToCreate.push({
                                userId: enrollment.userId,
                                type: 'DEADLINE_REMINDER',
                                content: `Reminder: '${assignment.title}' in ${assignment.course.courseCode} is due in exactly ${window.label}!`,
                                targetType: 'ASSIGNMENT',
                                targetId: assignment.id,
                                targetUrl: `/courses/${assignment.courseId}/tasks`
                            });

                        
                            // Check email notification preference, and if enabled, add to the email queue
                            const emailEnabled = prefs ? prefs.emailEnabled : false;
                            if (emailEnabled && enrollment.user.kaistEmail) {
                                emailsToSend.push({
                                    to: enrollment.user.kaistEmail,
                                    subject: `[Nupjuk Campus] Deadline Reminder: ${assignment.title}`,
                                    text: `Hello ${enrollment.user.displayName},\n\nThis is a reminder that the assignment "${assignment.title}" for course ${assignment.course.courseCode} is due in ${window.label}.\n\nPlease ensure you submit your work on time.`
                                });
                            }

                        }
                    }
                }

                // ==================================================
                // 2. Precisely target personal deadlines and schedules that are due in the exact minute window
                // ==================================================
                const upcomingPersonalEvents = await prisma.personalEvent.findMany({
                    where: { 
                        endTime: exactTimeFilter,
                        status: { not: 'done' } 
                    },
                    include: {
                        user: {
                            include: {
                                notificationPreferences: { where: { courseId: null } } // Only check global preferences for personal events
                            }
                        }
                    }
                });

                for (const event of upcomingPersonalEvents) {
                    const prefs = event.user.notificationPreferences[0];
                    if (prefs && prefs.deadlineEnabled === false) continue;

                    const content = `Personal Reminder: '${event.title}' is coming up in exactly ${window.label}.`;

                    notificationsToCreate.push({
                        userId: event.userId,
                        type: 'DEADLINE_REMINDER',
                        content: content,
                        targetType: 'PERSONAL_EVENT',
                        targetId: event.id,
                        targetUrl: `/calendar`
                    });

                    // Check global email notification preference, and if enabled, add to the email queue
                    const emailEnabled = prefs ? prefs.emailEnabled : false;
                    if (emailEnabled && event.user.kaistEmail) {
                        emailsToSend.push({
                            to: event.user.kaistEmail,
                            subject: `[Nupjuk Campus] Personal Event Reminder: ${event.title}`,
                            text: `Hello ${event.user.displayName},\n\nYour personal event "${event.title}" is coming up in ${window.label}.`
                        });
                    }
                }
            }

            // ==================================================
            // 3. Execute the database write to create notifications for all matched events in this run
            // ==================================================
            if (notificationsToCreate.length > 0) {
                // Write all notifications to the database
                await prisma.notification.createMany({ data: notificationsToCreate });

                // WebSocket real-time notification
                for (const notification of notificationsToCreate) {
                    if (io) {
                        io.to(`user_${notification.userId}`).emit('new_notification', {
                            message: notification.content
                        });
                    }
                }
                
                // Trigger the actual sending of emails in the queue
                for (const email of emailsToSend) {
                    try {
                        await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: email.to,
                        subject: email.subject,
                        text: email.text
                        });
                    } catch (err) {
                        console.error(`Failed to send email to ${email.to}:`, err);
                    }
                }
            }

        } catch (error) {
            console.error('Cron Job Failed:', error);
        }
    });
};