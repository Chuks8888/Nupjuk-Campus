require("dotenv/config");

const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const password = "password123";

function date(value) {
  return new Date(value);
}

// Calculate dynamic times for demo assignments (+4h and +25h)
const now = new Date();
const in4Hours = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

async function upsertPost(data) {
  const existing = await prisma.post.findFirst({
    where: {
      boardId: data.boardId,
      authorId: data.authorId,
      title: data.title,
    },
  });

  if (existing) {
    return prisma.post.update({
      where: { id: existing.id },
      data: {
        body: data.body,
        category: data.category,
      },
    });
  }

  return prisma.post.create({ data });
}

async function upsertComment(data) {
  const existing = await prisma.comment.findFirst({
    where: {
      postId: data.postId,
      authorId: data.authorId,
      body: data.body,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.comment.create({ data });
}

async function upsertPersonalEvent(data) {
  const existing = await prisma.personalEvent.findFirst({
    where: {
      userId: data.userId,
      title: data.title,
      startTime: data.startTime,
    },
  });

  if (existing) {
    return prisma.personalEvent.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.personalEvent.create({ data });
}

async function upsertMeetingEvent(data) {
  const existing = await prisma.meetingEvent.findFirst({
    where: {
      courseId: data.courseId,
      creatorId: data.creatorId,
      title: data.title,
    },
  });

  if (existing) {
    return prisma.meetingEvent.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.meetingEvent.create({ data });
}

async function upsertNotification(data) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId: data.userId,
      type: data.type,
      content: data.content,
    },
  });

  if (existing) {
    return prisma.notification.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.notification.create({ data });
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  const users = {};
  const userSeeds = [
    {
      studentId: "20260001",
      kaistEmail: "student@kaist.ac.kr",
      displayName: "Demo Student",
    },
    {
      studentId: "20260012",
      kaistEmail: "minji.kim@kaist.ac.kr",
      displayName: "Minji Kim",
    },
    {
      studentId: "20260027",
      kaistEmail: "jisoo.park@kaist.ac.kr",
      displayName: "Jisoo Park",
    },
    {
      studentId: "20250044",
      kaistEmail: "hyunwoo.lee@kaist.ac.kr",
      displayName: "Hyunwoo Lee",
    },
    {
      studentId: "20240031",
      kaistEmail: "sara.choi@kaist.ac.kr",
      displayName: "Sara Choi",
    },
    {
      studentId: "20266111",
      kaistEmail: "htarczynski@kaist.ac.kr",
      displayName: "Hugo Tarczynski",
    },
  ];

  for (const user of userSeeds) {
    users[user.kaistEmail] = await prisma.user.upsert({
      where: { kaistEmail: user.kaistEmail },
      update: {
        studentId: user.studentId,
        displayName: user.displayName,
        passwordHash,
      },
      create: {
        ...user,
        passwordHash,
      },
    });
  }

  const courses = {};
  const courseSeeds = [
    {
      courseCode: "CS.10003",
      courseName: "Elements of AI",
      semester: "2026 Spring",
      klmsCourseId: "klms-cs10003-2026s",
    },
    {
      courseCode: "CS.30408",
      courseName: "Introduction to Information Security",
      semester: "2026 Spring",
      klmsCourseId: "klms-cs30408-2026s",
    },
    {
      courseCode: "CS.30500",
      courseName: "Introduction to Software Engineering",
      semester: "2026 Spring",
      klmsCourseId: "klms-cs30500-2026s",
    },
    {
      courseCode: "CS.30704",
      courseName: "Introduction to Human-Computer Interaction",
      semester: "2026 Spring",
      klmsCourseId: "klms-cs30704-2026s",
    },
    {
      courseCode: "CS.40503",
      courseName: "Automated Software Testing",
      semester: "2026 Spring",
      klmsCourseId: "klms-cs40503-2026s",
    },
  ];

  for (const course of courseSeeds) {
    courses[course.courseCode] = await prisma.course.upsert({
      where: { klmsCourseId: course.klmsCourseId },
      update: course,
      create: course,
    });
  }

  const boards = {};
  for (const course of Object.values(courses)) {
    boards[course.courseCode] = await prisma.board.upsert({
      where: { courseId: course.id },
      update: {
        introText: `${course.courseName} discussion board`,
      },
      create: {
        courseId: course.id,
        introText: `${course.courseName} discussion board`,
      },
    });
  }

  // htarczynski@kaist.ac.kr is excluded from enrollments so he remains empty.
  const enrollmentPlan = {
    "student@kaist.ac.kr": [
      "CS.10003",
      "CS.30408",
      "CS.30500",
      "CS.30704",
      "CS.40503",
    ],
    "minji.kim@kaist.ac.kr": ["CS.10003", "CS.30500", "CS.30704"],
    "jisoo.park@kaist.ac.kr": ["CS.30500", "CS.30408"],
    "hyunwoo.lee@kaist.ac.kr": ["CS.30704", "CS.30408", "CS.40503"],
    "sara.choi@kaist.ac.kr": ["CS.30500", "CS.10003", "CS.40503"],
  };

  for (const [email, courseCodes] of Object.entries(enrollmentPlan)) {
    for (const courseCode of courseCodes) {
      await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: users[email].id,
            courseId: courses[courseCode].id,
          },
        },
        update: {
          verifiedAt: date("2026-03-02T09:00:00+09:00"),
          validUntil: date("2026-06-30T23:59:59+09:00"),
          status: "active",
          role: "student",
        },
        create: {
          userId: users[email].id,
          courseId: courses[courseCode].id,
          verifiedAt: date("2026-03-02T09:00:00+09:00"),
          validUntil: date("2026-06-30T23:59:59+09:00"),
          status: "active",
          role: "student",
        },
      });
    }
  }

  const now = new Date();

  // Create a date exactly 3 hours and 2 minutes from right now
  const test3hDate = new Date(
    now.getTime() + 3 * 60 * 60 * 1000 + 2 * 60 * 1000,
  );

  // Create a date exactly 24 hours and 2 minutes from right now
  const test24hDate = new Date(
    now.getTime() + 24 * 60 * 60 * 1000 + 2 * 60 * 1000,
  );

  const assignmentSeeds = [
    [
      "CS.30500",
      "Milestone 3: Architecture and API Contract",
      test3hDate.toISOString(),
      "Finalize module boundaries, endpoint contracts, and risk notes.",
      "cs30500-m3",
    ],
    [
      "CS.30500",
      "Sprint Review Demo",
      test24hDate.toISOString(),
      "Prepare a five minute demo with at least one end-to-end user flow.",
      "cs30500-demo",
    ],
    [
      "CS.30704",
      "Contextual Inquiry Report",
      "2026-05-23T23:59:00+09:00",
      "Summarize interview findings and design implications.",
      "cs30704-ci",
    ],
    [
      "CS.30408",
      "Cryptography Basics Quiz",
      "2026-05-27T23:59:00+09:00",
      "Short quiz on symmetric vs asymmetric encryption.",
      "cs30408-crypto-quiz",
    ],
    [
      "CS.10003",
      "Neural Networks Homework",
      "2026-05-26T23:59:00+09:00",
      "Exercises on backpropagation and gradient descent.",
      "cs10003-nn-hw",
    ],
    [
      "CS.40503",
      "Unit Testing Strategy Draft",
      "2026-05-28T23:59:00+09:00",
      "Upload a testing strategy draft for the main module.",
      "cs40503-draft",
    ],
    // Demo dynamic deadline assignments (+4h and +25h)
    [
      "CS.30500",
      "URGENT: Mid-Sprint Check-in",
      in4Hours,
      "Submit current progress report (Due in 4 hours).",
      "cs30500-urgent-4h",
    ],
    [
      "CS.30704",
      "Heuristic Evaluation Submission",
      in25Hours,
      "Complete the peer heuristic evaluation template (Due in 25 hours).",
      "cs30704-he-25h",
    ],
  ];

  const assignments = {};
  for (const [
    courseCode,
    title,
    dueDate,
    description,
    klmsAssignmentId,
  ] of assignmentSeeds) {
    const assignmentUrl = `https://klms.kaist.ac.kr/mod/assign/view.php?id=${klmsAssignmentId}`;
    assignments[klmsAssignmentId] = await prisma.assignment.upsert({
      where: { assignmentUrl },
      update: {
        courseId: courses[courseCode].id,
        title,
        dueDate: date(dueDate),
        description,
        source: "klms_synced",
        klmsAssignmentId,
      },
      create: {
        courseId: courses[courseCode].id,
        title,
        dueDate: date(dueDate),
        description,
        source: "klms_synced",
        klmsAssignmentId,
        assignmentUrl,
      },
    });
  }

  const demo = users["student@kaist.ac.kr"];
  const demoStatuses = [
    ["cs30500-m3", "not_submitted", "in_progress"],
    ["cs30500-demo", "not_submitted", "todo"],
    ["cs30704-ci", "submitted", "done"],
    ["cs30408-crypto-quiz", "not_submitted", "in_progress"],
    ["cs10003-nn-hw", "submitted", "done"],
    ["cs40503-draft", "not_submitted", "in_progress"],
    // Dynamic assignments
    ["cs30500-urgent-4h", "not_submitted", "todo"],
    ["cs30704-he-25h", "not_submitted", "todo"],
  ];

  for (const [
    assignmentKey,
    klmsSubmissionStatus,
    userCompletionStatus,
  ] of demoStatuses) {
    await prisma.userAssignmentStatus.upsert({
      where: {
        userId_assignmentId: {
          userId: demo.id,
          assignmentId: assignments[assignmentKey].id,
        },
      },
      update: {
        klmsSubmissionStatus,
        userCompletionStatus,
        completedAt:
          userCompletionStatus === "done"
            ? date("2026-05-20T14:10:00+09:00")
            : null,
      },
      create: {
        userId: demo.id,
        assignmentId: assignments[assignmentKey].id,
        klmsSubmissionStatus,
        userCompletionStatus,
        completedAt:
          userCompletionStatus === "done"
            ? date("2026-05-20T14:10:00+09:00")
            : null,
      },
    });
  }

  const postSeeds = [
    [
      "CS.30500",
      "student@kaist.ac.kr",
      "How are people structuring the API contract?",
      "Our team is splitting endpoints by auth, ingest, calendar, and boards. Curious if anyone found a cleaner way to document request shapes.",
      "QUESTION",
    ],
    [
      "CS.30500",
      "minji.kim@kaist.ac.kr",
      "Sprint review checklist",
      "We made a small checklist for demo readiness: seed data, login flow, one failing-state screenshot, and known limitations.",
      "GENERAL",
    ],
    [
      "CS.30704",
      "sara.choi@kaist.ac.kr",
      "Prototype test participants",
      "If anyone still needs a pilot participant, I can trade one session tomorrow afternoon.",
      "GENERAL",
    ],
    [
      "CS.30408",
      "jisoo.park@kaist.ac.kr",
      "Key exchange algorithms",
      "Are we supposed to cover Diffie-Hellman in depth for the upcoming quiz?",
      "QUESTION",
    ],
    [
      "CS.10003",
      "student@kaist.ac.kr",
      "Learning rate decay",
      "Is anyone else finding their loss plateauing too early on the second dataset?",
      "QUESTION",
    ],
    [
      "CS.40503",
      "hyunwoo.lee@kaist.ac.kr",
      "Test coverage tools",
      "Which tool are you guys using for Jest coverage reporting?",
      "GENERAL",
    ],
  ];

  const posts = [];
  for (const [courseCode, email, title, body, category] of postSeeds) {
    posts.push(
      await upsertPost({
        boardId: boards[courseCode].id,
        authorId: users[email].id,
        title,
        body,
        category,
      }),
    );
  }

  const commentSeeds = [
    [
      0,
      "minji.kim@kaist.ac.kr",
      "We used a one-page table with method, path, auth, request, and response columns.",
    ],
    [
      0,
      "jisoo.park@kaist.ac.kr",
      "Adding sample error responses helped us find mismatches early.",
    ],
    [
      1,
      "student@kaist.ac.kr",
      "This is useful. The seed data point is easy to forget.",
    ],
    [
      2,
      "student@kaist.ac.kr",
      "I can do a pilot around 4pm if that still helps.",
    ],
    [
      3,
      "sara.choi@kaist.ac.kr",
      "The TA mentioned just the high-level concept is enough.",
    ],
    [
      4,
      "minji.kim@kaist.ac.kr",
      "Try adding a step decay scheduler, it helped our model converge.",
    ],
  ];

  for (const [postIndex, email, body] of commentSeeds) {
    await upsertComment({
      postId: posts[postIndex].id,
      authorId: users[email].id,
      body,
    });
  }

  const personalEvents = [
    [
      "Morning lecture block",
      "2026-05-22T09:00:00+09:00",
      "2026-05-22T12:00:00+09:00",
      "CS.30500 and CS.30704 back to back",
      "todo",
    ],
    [
      "Team 10 implementation sync",
      "2026-05-22T19:00:00+09:00",
      "2026-05-22T20:30:00+09:00",
      "Check Docker, auth, and KLMS ingestion status",
      "todo",
    ],
  ];

  for (const [
    title,
    startTime,
    endTime,
    description,
    status,
  ] of personalEvents) {
    await upsertPersonalEvent({
      userId: demo.id,
      title,
      startTime: date(startTime),
      endTime: date(endTime),
      description,
      status,
    });
  }

  const meeting = await upsertMeetingEvent({
    courseId: courses["CS.30500"].id,
    creatorId: demo.id,
    title: "Team 10 Sprint Planning",
    description:
      "Pick the final demo path and divide backend/frontend cleanup.",
    dateRangeStart: date("2026-05-23T00:00:00+09:00"),
    dateRangeEnd: date("2026-05-25T23:59:59+09:00"),
    timeRangeStart: "18:00",
    timeRangeEnd: "22:00",
    finalizedStartTime: null,
    finalizedEndTime: null,
    status: "open",
  });

  for (const email of [
    "student@kaist.ac.kr",
    "minji.kim@kaist.ac.kr",
    "jisoo.park@kaist.ac.kr",
  ]) {
    await prisma.meetingParticipant.upsert({
      where: {
        meetingEventId_userId: {
          meetingEventId: meeting.id,
          userId: users[email].id,
        },
      },
      update: {},
      create: {
        meetingEventId: meeting.id,
        userId: users[email].id,
      },
    });

    await prisma.meetingAvailability.upsert({
      where: {
        meetingEventId_userId: {
          meetingEventId: meeting.id,
          userId: users[email].id,
        },
      },
      update: {
        availableSlots: [
          "2026-05-23T19:00:00+09:00",
          "2026-05-24T20:00:00+09:00",
        ],
      },
      create: {
        meetingEventId: meeting.id,
        userId: users[email].id,
        availableSlots: [
          "2026-05-23T19:00:00+09:00",
          "2026-05-24T20:00:00+09:00",
        ],
      },
    });
  }

  await upsertNotification({
    userId: demo.id,
    type: "deadline",
    content: "CS.30500 Sprint Demo is due soon.",
    deliveryChannel: "in_app",
    targetType: "assignment",
    targetId: assignments["cs30500-demo"].id,
    targetUrl: assignments["cs30500-demo"].assignmentUrl,
    isRead: false,
  });

  await upsertNotification({
    userId: demo.id,
    type: "comment",
    content: "Minji replied to your CS.30500 API contract question.",
    deliveryChannel: "in_app",
    targetType: "post",
    targetId: posts[0].id,
    targetUrl: `/boards/posts/${posts[0].id}`,
    isRead: false,
  });

  const counts = {
    users: await prisma.user.count(),
    courses: await prisma.course.count(),
    enrollments: await prisma.enrollment.count(),
    assignments: await prisma.assignment.count(),
    posts: await prisma.post.count(),
    comments: await prisma.comment.count(),
    personalEvents: await prisma.personalEvent.count(),
    meetings: await prisma.meetingEvent.count(),
    notifications: await prisma.notification.count(),
  };

  console.log("Seed complete.");
  console.log(`Demo login: student@kaist.ac.kr / ${password}`);
  console.table(counts);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
