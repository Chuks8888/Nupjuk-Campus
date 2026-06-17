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
      studentId: "99990001",
      kaistEmail: "student@demo.edu",
      displayName: "Demo Student",
    },
    {
      studentId: "99990002",
      kaistEmail: "alice.smith@demo.edu",
      displayName: "Alice Smith",
    },
    {
      studentId: "99990003",
      kaistEmail: "bob.johnson@demo.edu",
      displayName: "Bob Johnson",
    },
    {
      studentId: "99990004",
      kaistEmail: "charlie.davis@demo.edu",
      displayName: "Charlie Davis",
    },
    {
      studentId: "99990005",
      kaistEmail: "diana.evans@demo.edu",
      displayName: "Diana Evans",
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
      courseCode: "DEMO.1001",
      courseName: "Introduction to Synthetic Data",
      semester: "2026 Spring",
      klmsCourseId: "DEMO.1001_2026_1",
    },
    {
      courseCode: "DEMO.2001",
      courseName: "Principles of Mock Interfaces",
      semester: "2026 Spring",
      klmsCourseId: "DEMO.2001_2026_1",
    },
    {
      courseCode: "DEMO.3001",
      courseName: "Advanced Placeholder Structures",
      semester: "2026 Spring",
      klmsCourseId: "DEMO.3001_2026_1",
    },
    {
      courseCode: "DEMO.4001",
      courseName: "Simulated System Dynamics",
      semester: "2026 Spring",
      klmsCourseId: "DEMO.4001_2026_1",
    },
    {
      courseCode: "DEMO.5001",
      courseName: "Fictional Engineering Practices",
      semester: "2026 Spring",
      klmsCourseId: "DEMO.5001_2026_1",
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

  const enrollmentPlan = {
    "student@demo.edu": [
      "DEMO.1001",
      "DEMO.2001",
      "DEMO.3001",
      "DEMO.4001",
      "DEMO.5001",
    ],
    "alice.smith@demo.edu": ["DEMO.1001", "DEMO.3001", "DEMO.4001"],
    "bob.johnson@demo.edu": ["DEMO.3001", "DEMO.2001"],
    "charlie.davis@demo.edu": ["DEMO.4001", "DEMO.2001", "DEMO.5001"],
    "diana.evans@demo.edu": ["DEMO.3001", "DEMO.1001", "DEMO.5001"],
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

  const timeNow = new Date();

  // Create a date exactly 3 hours and 2 minutes from right now
  const test3hDate = new Date(
    timeNow.getTime() + 3 * 60 * 60 * 1000 + 2 * 60 * 1000,
  );

  // Create a date exactly 24 hours and 2 minutes from right now
  const test24hDate = new Date(
    timeNow.getTime() + 24 * 60 * 60 * 1000 + 2 * 60 * 1000,
  );

  const assignmentSeeds = [
    [
      "DEMO.3001",
      "Milestone 3: Mock Architecture and API Contract",
      test3hDate.toISOString(),
      "Finalize dummy module boundaries, placeholder endpoints, and fake risk notes.",
      "demo3001-m3",
    ],
    [
      "DEMO.3001",
      "Mock Sprint Review Demo",
      test24hDate.toISOString(),
      "Prepare a simulated five minute demo with at least one mock user flow.",
      "demo3001-demo",
    ],
    [
      "DEMO.4001",
      "Synthetic Inquiry Report",
      "2026-05-23T23:59:00+09:00",
      "Summarize dummy interview findings and mock design implications.",
      "demo4001-ci",
    ],
    [
      "DEMO.2001",
      "Fictional Basics Quiz",
      "2026-05-27T23:59:00+09:00",
      "Short quiz on simulated topics.",
      "demo2001-quiz",
    ],
    [
      "DEMO.1001",
      "Placeholder Homework",
      "2026-05-26T23:59:00+09:00",
      "Exercises on placeholder concepts and dummy data generation.",
      "demo1001-hw",
    ],
    [
      "DEMO.5001",
      "Simulated Strategy Draft",
      "2026-05-28T23:59:00+09:00",
      "Upload a mock strategy draft for the main component.",
      "demo5001-draft",
    ],
    // Demo dynamic deadline assignments (+4h and +25h)
    [
      "DEMO.3001",
      "URGENT: Mid-Sprint Fake Check-in",
      in4Hours,
      "Submit simulated progress report (Due in 4 hours).",
      "demo3001-urgent-4h",
    ],
    [
      "DEMO.4001",
      "Dummy Evaluation Submission",
      in25Hours,
      "Complete the fictional evaluation template (Due in 25 hours).",
      "demo4001-he-25h",
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
    const assignmentUrl = `https://mock.demo.edu/mod/assign/view.php?id=${klmsAssignmentId}`;
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

  const demoUser = users["student@demo.edu"];
  const demoStatuses = [
    ["demo3001-m3", "not_submitted", "in_progress"],
    ["demo3001-demo", "not_submitted", "todo"],
    ["demo4001-ci", "submitted", "done"],
    ["demo2001-quiz", "not_submitted", "in_progress"],
    ["demo1001-hw", "submitted", "done"],
    ["demo5001-draft", "not_submitted", "in_progress"],
    // Dynamic assignments
    ["demo3001-urgent-4h", "not_submitted", "todo"],
    ["demo4001-he-25h", "not_submitted", "todo"],
  ];

  for (const [
    assignmentKey,
    klmsSubmissionStatus,
    userCompletionStatus,
  ] of demoStatuses) {
    await prisma.userAssignmentStatus.upsert({
      where: {
        userId_assignmentId: {
          userId: demoUser.id,
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
        userId: demoUser.id,
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
      "DEMO.3001",
      "student@demo.edu",
      "How are people structuring the mock data?",
      "Our team is splitting fake data by users, roles, and components. Curious if anyone found a cleaner way.",
      "QUESTION",
    ],
    [
      "DEMO.3001",
      "alice.smith@demo.edu",
      "Mock review checklist",
      "We made a small checklist for demo readiness using dummy data and placeholder graphics.",
      "GENERAL",
    ],
    [
      "DEMO.4001",
      "diana.evans@demo.edu",
      "Fictional test participants",
      "If anyone still needs a simulated participant profile, I can trade one session tomorrow.",
      "GENERAL",
    ],
    [
      "DEMO.2001",
      "bob.johnson@demo.edu",
      "Simulated algorithms",
      "Are we supposed to cover mock functions in depth for the upcoming dummy quiz?",
      "QUESTION",
    ],
    [
      "DEMO.1001",
      "student@demo.edu",
      "Placeholder metric issues",
      "Is anyone else finding their metrics plateauing too early on the mock dataset?",
      "QUESTION",
    ],
    [
      "DEMO.5001",
      "charlie.davis@demo.edu",
      "Test coverage on dummies",
      "Which tool are you guys using for reporting fake coverage data?",
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
      "alice.smith@demo.edu",
      "We used a simple JSON structure with fake IDs and static strings.",
    ],
    [
      0,
      "bob.johnson@demo.edu",
      "Adding random number generators helped us find UI bugs early.",
    ],
    [
      1,
      "student@demo.edu",
      "This is useful. Keeping the mock graphics consistent is hard.",
    ],
    [
      2,
      "student@demo.edu",
      "I can run a dummy test profile around 4pm if that helps.",
    ],
    [
      3,
      "diana.evans@demo.edu",
      "The instructor mentioned just the high-level mock concepts are enough.",
    ],
    [
      4,
      "alice.smith@demo.edu",
      "Try refreshing the random seed, it helped our fake charts look better.",
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
      "Mock Morning Block",
      "2026-05-22T09:00:00+09:00",
      "2026-05-22T12:00:00+09:00",
      "DEMO.3001 and DEMO.4001 back to back",
      "todo",
    ],
    [
      "Team Dummy Sync",
      "2026-05-22T19:00:00+09:00",
      "2026-05-22T20:30:00+09:00",
      "Check mock endpoints, static assets, and simulated ingestion status",
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
      userId: demoUser.id,
      title,
      startTime: date(startTime),
      endTime: date(endTime),
      description,
      status,
    });
  }

  const meeting = await upsertMeetingEvent({
    courseId: courses["DEMO.3001"].id,
    creatorId: demoUser.id,
    title: "Team Demo Planning",
    description:
      "Pick the final dummy path and divide fake backend/frontend cleanup.",
    dateRangeStart: date("2026-05-23T00:00:00+09:00"),
    dateRangeEnd: date("2026-05-25T23:59:59+09:00"),
    timeRangeStart: "18:00",
    timeRangeEnd: "22:00",
    finalizedStartTime: null,
    finalizedEndTime: null,
    status: "open",
  });

  for (const email of [
    "student@demo.edu",
    "alice.smith@demo.edu",
    "bob.johnson@demo.edu",
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
    userId: demoUser.id,
    type: "deadline",
    content: "DEMO.3001 Sprint Demo is due soon.",
    deliveryChannel: "in_app",
    targetType: "assignment",
    targetId: assignments["demo3001-demo"].id,
    targetUrl: assignments["demo3001-demo"].assignmentUrl,
    isRead: false,
  });

  await upsertNotification({
    userId: demoUser.id,
    type: "comment",
    content: "Alice replied to your DEMO.3001 mock data question.",
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
  console.log(`Demo login: student@demo.edu / ${password}`);
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
