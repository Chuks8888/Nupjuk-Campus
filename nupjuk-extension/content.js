// This script runs inside KLMS pages.
// It extracts basic course information from the KLMS homepage.

window.addEventListener("message", async (event) => {
  if (event.source !== window) return;

  if (
    event.data?.source === "NUPJUK_WEB" &&
    event.data?.type === "NUPJUK_AUTH_TOKEN" &&
    event.data?.token
  ) {
    await chrome.storage.local.set({
      token: event.data.token,
    });

    console.log("Nupjuk token saved from web login");
  }
});

if (window.location.hostname === "klms.kaist.ac.kr") {
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

  function parseKlmsDate(dateText) {
    if (!dateText) return null;

    const parsedDate = new Date(dateText);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate.toISOString();
  }

  function parseAssignmentDetailStatusFromDoc(doc, fallbackText) {
    let submissionStatusText = "";
    let timeRemainingText = "";
    let dueDateText = "";

    const rows = [...doc.querySelectorAll("tr")];

    for (const row of rows) {
      const header = row.querySelector("th")?.innerText?.trim().toLowerCase();
      const value = row.querySelector("td")?.innerText?.trim() || "";
      const normalizedValue = value.toLowerCase();

      if (header === "submission status") {
        submissionStatusText = normalizedValue;
      }

      if (header === "time remaining") {
        timeRemainingText = normalizedValue;
      }

      if (header === "due date") {
        dueDateText = value;
      }
    }

    const klmsSubmissionStatus =
      submissionStatusText.includes("submitted for grading") ||
      submissionStatusText === "submitted"
        ? "submitted"
        : "not_submitted";

    let klmsTimingStatus = "on_time";

    if (
      timeRemainingText.includes("assignment is overdue") ||
      timeRemainingText.includes("overdue by")
    ) {
      klmsTimingStatus = "overdue";
    }

    if (
      timeRemainingText.includes("submitted") &&
      timeRemainingText.includes("late")
    ) {
      klmsTimingStatus = "late_submitted";
    }

    const dueDate = parseKlmsDate(dueDateText);

    console.log("Parsed KLMS fields:", {
      submissionStatusText,
      timeRemainingText,
      dueDateText,
      dueDate,
      klmsSubmissionStatus,
      klmsTimingStatus,
    });

    return {
      klmsSubmissionStatus,
      klmsTimingStatus,
      dueDate,
    };
  }

  async function fetchAssignmentDetailStatus(assignment) {
    if (!assignment.assignmentUrl) {
      return null;
    }

    try {
      const res = await fetch(assignment.assignmentUrl, {
        credentials: "include",
      });

      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const text = doc.body?.innerText || "";

      const parsedStatus = parseAssignmentDetailStatusFromDoc(doc, text);

      return {
        assignmentId: assignment.assignmentId,
        klmsSubmissionStatus: parsedStatus.klmsSubmissionStatus,
        klmsTimingStatus: parsedStatus.klmsTimingStatus,
        dueDate: parsedStatus.dueDate,
      };
    } catch (error) {
      console.error("Failed to fetch assignment detail:", assignment.title, error);

      return {
        assignmentId: assignment.assignmentId,
        klmsSubmissionStatus: "not_submitted",
        klmsTimingStatus: "on_time",
        dueDate: null,
      };
    }
  }

  async function syncTrackedAssignmentStatuses(token) {
    console.log("Fetching tracked assignments from backend");

    const trackedRes = await fetch("http://localhost:3000/ingest/tracked-assignments", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const trackedData = await trackedRes.json();

    console.log("Tracked assignments response:", trackedRes.status, trackedData);
    console.log("Tracked assignment count:", trackedData.assignments?.length);

    if (!trackedRes.ok) {
      console.error("Failed to fetch tracked assignments:", trackedData);
      return;
    }

    const statuses = [];

    for (const assignment of trackedData.assignments) {
      console.log("Fetching detail for assignment:", assignment.title, assignment.assignmentUrl);

      const status = await fetchAssignmentDetailStatus(assignment);

      console.log("Parsed detail status:", status);

      if (status) {
        statuses.push(status);
      }
    }

    if (statuses.length === 0) {
      console.log("No tracked assignment statuses to update.");
      return;
    }

    const updateRes = await fetch("http://localhost:3000/ingest/assignment-statuses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ statuses }),
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      console.error("Failed to update assignment statuses:", updateData);
      return;
    }

    console.log("Assignment detail statuses updated:", updateData);
  }

  async function syncToBackend(parsedData) {

    const { token } = await chrome.storage.local.get(["token"]);

    if (!token) {
      console.error("No token found. Please log in first.");
      return;
    }

    console.log("Token found. Syncing KLMS data to backend.");

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
      try {
        const assignmentRes = await fetch("http://localhost:3000/ingest/assignments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            semester: parsedData.semester,
            assignments: parsedData.assignments,
          }),
        });

        const assignmentData = await assignmentRes.json();
        console.log("Assignment ingest success:", assignmentData);
      } catch (err) {
        console.error("Assignment ingest failed:", err);
      }
    }

    console.log("About to sync tracked assignment statuses");
    await syncTrackedAssignmentStatuses(token);
  }

  syncToBackend(parsedData);

  chrome.storage.local.get(["token"]).then((result) => {
    console.log("stored token result:", result.token ? "token exists" : "no token");
  });
}