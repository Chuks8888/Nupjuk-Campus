import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import meRouter from "./routes/me";
import ingestRouter from "./routes/ingest";
import personalEventsRouter from "./routes/personalEvents";
import calendarRouter from "./routes/calendar";
import boardsRouter from "./routes/boards";
import commentsRouter from "./routes/comments";
import coursesRouter from "./routes/courses";
import meetingsRouter from "./routes/meetings";
import notificationsRouter from "./routes/notifications";
import path from "path";
import attachmentsRouter from "./routes/attachments";
import { cleanupExpiredAttachments } from "./jobs/cleanupExpiredAttachments";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Nupjuk backend running");
});

app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/ingest", ingestRouter);
app.use("/personal-events", personalEventsRouter);
app.use("/calendar", calendarRouter);
app.use("/courses", coursesRouter);
app.use("/meetings", meetingsRouter);
app.use("/notifications", notificationsRouter);
app.use("/boards", boardsRouter);
app.use("/comments", commentsRouter);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/attachments", attachmentsRouter);

setInterval(() => {
  cleanupExpiredAttachments();
}, 1000 * 60 * 60);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
