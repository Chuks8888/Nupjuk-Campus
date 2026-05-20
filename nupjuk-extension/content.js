// This script runs inside KLMS pages.
// It extracts basic course information from the KLMS homepage.

console.log("Nupjuk extension is running on KLMS!");

function extractKlmsCourseId(href) {
  try {
    const url = new URL(href);
    return url.searchParams.get("id");
  } catch (error) {
    return null;
  }
}

function extractProfileFromKLMS() {
  const userSelect = document.querySelector(".multi-users");

  if (!userSelect) {
    console.warn("multi-users element not found");
    return null;
  }

  const text = userSelect.value || userSelect.textContent;

  console.log("Raw profile text:", text);

  const match = text.match(/^(.*?)\s*\[Enrolled\/(\d+)\]/);

  if (!match) {
    console.warn("Could not parse profile");
    return null;
  }

  return {
    displayName: match[1].trim(),
    studentId: match[2].trim(),
  };
}

function parseCoursesFromPage() {
  const lines = document.body.innerText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const courses = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];

    // Example: CS.30500, HSS.10006
    const isCourseCode = /^[A-Z]{2,4}\.\d{5}$/.test(currentLine);

    if (!isCourseCode) {
      continue;
    }

    const courseCode = currentLine;
    const courseName = lines[i + 1] || "";
    const attendees = lines[i + 2] || "";
    const credit = lines[i + 3] || "";
    const professor = lines[i + 4] || "";

    courses.push({
      courseCode,
      courseName,
      attendees,
      credit,
      professor,
      klmsCourseId: null,
      url: null
    });
  }

  const links = [...document.querySelectorAll("a")]
    .map((a) => ({
      text: a.innerText.trim(),
      href: a.href,
      klmsCourseId: extractKlmsCourseId(a.href)
    }))
    .filter((link) => {
      return (
        link.href.includes("/course/view.php") &&
        link.klmsCourseId !== null
      );
    });

  for (const course of courses) {
    const matchedLink = links.find((link) => {
      return link.text.includes(course.courseName);
    });

    if (matchedLink) {
      course.klmsCourseId = matchedLink.klmsCourseId;
      course.url = matchedLink.href;
    }
  }

  return courses;
}

function parseAssignments() {
  const assignmentBoxes = document.querySelectorAll(".list-box.assign");

  return Array.from(assignmentBoxes).map((box) => {
    const links = Array.from(box.querySelectorAll("a"));

    let dueDate = null;
    let title = "";
    let courseName = "";
    let assignmentUrl = null;

    for (const link of links) {
      const text = link.textContent.trim();

      // due date
      if (/\d{4}\.\d{2}\.\d{2}/.test(text)) {
        const matches = text.match(/\d{4}\.\d{2}\.\d{2}/g);

        if (matches && matches.length > 0) {
          dueDate = matches[matches.length - 1].replaceAll(".", "-");
        }

        continue;
      }

      // assignment title
      if (text.includes("[Assignment]")) {
        title = text.replace("[Assignment]", "").trim();
        assignmentUrl = link.href;
        continue;
      }

      // otherwise course name
      courseName = text;
    }

    return {
      title,
      courseName,
      dueDate,
      assignmentUrl,
      source: "klms_synced",
      klmsSubmissionStatus: "not_submitted"
    };
  });
}

function parseSemester() {
  const yearSelect = document.querySelector('select[name="year"]');
  const semesterSelect = document.querySelector('select[name="semester"]');

  const year =
    yearSelect?.selectedOptions?.[0]?.textContent?.trim();

  const semester =
    semesterSelect?.selectedOptions?.[0]?.textContent?.trim();

  if (!year || !semester) {
    throw new Error("Failed to parse semester");
  }

  return `${year} ${semester}`;
}

const profile = extractProfileFromKLMS();
const semester = parseSemester();
const courses = parseCoursesFromPage();

const parsedData = {
  source: "KLMS",
  syncedAt: new Date().toISOString(),
  pageUrl: window.location.href,
  pageTitle: document.title,
  profile,
  semester,
  courses,
  assignments: parseAssignments()
};

console.log("Parsed KLMS data:", parsedData);

console.log(
  "Parsed KLMS JSON:\n",
  JSON.stringify(parsedData, null, 2)
);
console.table(parsedData.assignments);

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImthaXN0RW1haWwiOiJmZWl5aW5nLmh1YW5nQGthaXN0LmFjLmtyIiwiaWF0IjoxNzc5MTIxMDc4LCJleHAiOjE3Nzk3MjU4Nzh9.yNbZgPHp6v6G9qMzMFvEQzavqtpB-xilSgD04Ep_WTQ";
console.log("CURRENT TOKEN:", token);

if (parsedData.profile) {
  fetch("http://localhost:3000/ingest/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(parsedData.profile),
  })
    .then((res) => res.json())
    .then((data) => console.log("Profile ingest success:", data))
    .catch((err) => console.error("Profile ingest failed:", err));
}

if (parsedData.courses.length > 0) {
fetch("http://localhost:3000/ingest/courses", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    courses: parsedData.courses.map((course) => ({
      courseCode: course.courseCode,
      courseName: course.courseName,
      semester: parsedData.semester,
      klmsCourseId: course.klmsCourseId,
    })),
  }),
})
  .then((res) => res.json())
  .then((data) => console.log("Course ingest success:", data))
  .catch((err) => console.error("Course ingest failed:", err));
}

if (parsedData.assignments.length > 0) {
fetch("http://localhost:3000/ingest/assignments", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    semester: parsedData.semester,
    assignments: parsedData.assignments,
  }),
})
  .then((res) => res.json())
  .then((data) => console.log("Assignment ingest success:", data))
  .catch((err) => console.error("Assignment ingest failed:", err));
}