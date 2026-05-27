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

async function upsertNotificationPreference(data) {
  const existing = await prisma.notificationPreference.findFirst({
    where: {
      userId: data.userId,
      courseId: data.courseId,
    },
  });

  if (existing) {
    return prisma.notificationPreference.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.notificationPreference.create({ data });
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
      courseCode: "CS.30500",
      courseName: "Introduction to Software Engineering",
      semester: "2026 Spring",
      klmsCourseId: "klms-cs350-2026s",
    },
    {
      courseCode: "CS.30704",
      courseName: "Introduction to Human-Computer Interaction",
      semester: "2026 Spring",
      klmsCourseId: "klms-cs374-2026s",
    },
    {
      courseCode: "CS.30300",
      courseName: "Operating Systems and Lab",
      semester: "2026 Spring",
      klmsCourseId: "klms-cs330-2026s",
    },
    {
      courseCode: "MAS.20705",
      courseName: "Discrete Mathematics",
      semester: "2026 Spring",
      klmsCourseId: "klms-mas275-2026s",
    },
    {
      courseCode: "HSS.10001",
      courseName: "Academic Writing",
      semester: "2026 Spring",
      klmsCourseId: "klms-hss101-2026s",
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
    "student@kaist.ac.kr": ["CS350", "CS374", "CS330", "MAS275", "HSS101"],
    "minji.kim@kaist.ac.kr": ["CS350", "CS374", "MAS275"],
    "jisoo.park@kaist.ac.kr": ["CS350", "CS330"],
    "hyunwoo.lee@kaist.ac.kr": ["CS374", "CS330", "HSS101"],
    "sara.choi@kaist.ac.kr": ["CS350", "MAS275", "HSS101"],
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

  const assignmentSeeds = [
    [
      "CS350",
      "Milestone 3: Architecture and API Contract",
      "2026-05-24T23:59:00+09:00",
      "Finalize module boundaries, endpoint contracts, and risk notes.",
      "cs350-m3",
    ],
    [
      "CS350",
      "Sprint Review Demo",
      "2026-05-31T18:00:00+09:00",
      "Prepare a five minute demo with at least one end-to-end user flow.",
      "cs350-demo",
    ],
    [
      "CS374",
      "Contextual Inquiry Report",
      "2026-05-23T23:59:00+09:00",
      "Summarize interview findings and design implications.",
      "cs374-ci",
    ],
    [
      "CS374",
      "Interactive Prototype Critique",
      "2026-06-02T23:59:00+09:00",
      "Submit annotated screenshots and usability issues.",
      "cs374-prototype",
    ],
    [
      "CS330",
      "Thread Scheduler Lab",
      "2026-05-27T23:59:00+09:00",
      "Implement priority scheduling and explain starvation handling.",
      "cs330-scheduler",
    ],
    [
      "CS330",
      "Filesystem Reading Quiz",
      "2026-06-04T11:59:00+09:00",
      "Short quiz covering inode layout and buffer cache behavior.",
      "cs330-fs-quiz",
    ],
    [
      "MAS275",
      "Problem Set 9: Graph Connectivity",
      "2026-05-26T23:59:00+09:00",
      "Exercises on trees, cuts, and bipartite graphs.",
      "mas275-ps9",
    ],
    [
      "MAS275",
      "Midterm Corrections",
      "2026-05-30T23:59:00+09:00",
      "Write corrected solutions for missed problems.",
      "mas275-corrections",
    ],
    [
      "HSS101",
      "Research Essay Draft",
      "2026-05-28T23:59:00+09:00",
      "Upload a 1200-word draft with at least four sources.",
      "hss101-draft",
    ],
    [
      "HSS101",
      "Peer Review Notes",
      "2026-06-03T17:00:00+09:00",
      "Leave review comments for two classmates.",
      "hss101-peer-review",
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
    ["cs350-m3", "not_submitted", "in_progress"],
    ["cs350-demo", "not_submitted", "todo"],
    ["cs374-ci", "submitted", "done"],
    ["cs374-prototype", "not_submitted", "todo"],
    ["cs330-scheduler", "not_submitted", "in_progress"],
    ["cs330-fs-quiz", "not_submitted", "todo"],
    ["mas275-ps9", "submitted", "done"],
    ["mas275-corrections", "not_submitted", "todo"],
    ["hss101-draft", "not_submitted", "in_progress"],
    ["hss101-peer-review", "not_submitted", "todo"],
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
      "CS350",
      "student@kaist.ac.kr",
      "How are people structuring the API contract?",
      "Our team is splitting endpoints by auth, ingest, calendar, and boards. Curious if anyone found a cleaner way to document request shapes.",
      "QUESTION",
    ],
    [
      "CS350",
      "minji.kim@kaist.ac.kr",
      "Sprint review checklist",
      "We made a small checklist for demo readiness: seed data, login flow, one failing-state screenshot, and known limitations.",
      "GENERAL",
    ],
    [
      "CS374",
      "sara.choi@kaist.ac.kr",
      "Prototype test participants",
      "If anyone still needs a pilot participant, I can trade one session tomorrow afternoon.",
      "GENERAL",
    ],
    [
      "CS374",
      "student@kaist.ac.kr",
      "Figma handoff question",
      "Do we need to include every hover state in the critique, or only the main error states?",
      "QUESTION",
    ],
    [
      "CS330",
      "jisoo.park@kaist.ac.kr",
      "Scheduler lab debugging tip",
      "Printing the ready queue after every context switch helped us catch a priority inversion bug quickly.",
      "GENERAL",
    ],
    [
      "CS330",
      "hyunwoo.lee@kaist.ac.kr",
      "Quiz scope for file systems",
      "Professor mentioned buffer cache replacement and inode direct/indirect blocks are fair game.",
      "EXAM",
    ],
    [
      "MAS275",
      "student@kaist.ac.kr",
      "Graph connectivity problem 4",
      "For the second direction, I think using the contrapositive makes the proof much shorter.",
      "QUESTION",
    ],
    [
      "MAS275",
      "minji.kim@kaist.ac.kr",
      "Study group before PS9",
      "A few of us are meeting at the library on Saturday at 2pm.",
      "GENERAL",
    ],
    [
      "HSS101",
      "sara.choi@kaist.ac.kr",
      "Peer review exchange",
      "I can review one extra draft tonight if someone can look at mine tomorrow.",
      "GENERAL",
    ],
    [
      "HSS101",
      "hyunwoo.lee@kaist.ac.kr",
      "Citation style reminder",
      "The instructor said APA is preferred, but consistency matters more than the exact style.",
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
      "Our TA said main error states are enough if the flow is clear.",
    ],
    [
      4,
      "student@kaist.ac.kr",
      "Nice tip. We had a similar issue when the idle thread stayed in the queue.",
    ],
    [
      5,
      "jisoo.park@kaist.ac.kr",
      "Thanks, I was wondering whether indirect blocks were included.",
    ],
    [6, "minji.kim@kaist.ac.kr", "Contrapositive worked for me too."],
    [7, "sara.choi@kaist.ac.kr", "I might join after my HCI meeting."],
    [8, "student@kaist.ac.kr", "I can swap reviews tomorrow morning."],
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
      "CS350 and CS374 back to back",
      "todo",
    ],
    [
      "Team 10 implementation sync",
      "2026-05-22T19:00:00+09:00",
      "2026-05-22T20:30:00+09:00",
      "Check Docker, auth, and KLMS ingestion status",
      "todo",
    ],
    [
      "Library study session",
      "2026-05-24T14:00:00+09:00",
      "2026-05-24T17:00:00+09:00",
      "MAS275 graph connectivity problems",
      "todo",
    ],
    [
      "Submit HSS101 draft",
      "2026-05-28T21:00:00+09:00",
      "2026-05-28T22:00:00+09:00",
      "Final proofreading before upload",
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
    courseId: courses.CS350.id,
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

  for (const course of Object.values(courses)) {
    await upsertNotificationPreference({
      userId: demo.id,
      courseId: course.id,
      postCommentEnabled: true,
      deadlineEnabled: true,
      meetingEnabled: true,
      emailEnabled: false,
      deadlineReminderTiming: ["24h", "3h"],
    });
  }

  await upsertNotification({
    userId: demo.id,
    type: "deadline",
    content: "CS350 Milestone 3 is due soon.",
    deliveryChannel: "in_app",
    targetType: "assignment",
    targetId: assignments["cs350-m3"].id,
    targetUrl: assignments["cs350-m3"].assignmentUrl,
    isRead: false,
  });

  await upsertNotification({
    userId: demo.id,
    type: "comment",
    content: "Minji replied to your CS350 API contract question.",
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
