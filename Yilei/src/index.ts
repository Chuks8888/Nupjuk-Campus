import express from "express";
import cors from "cors";
import path from 'path';
import authRouter from "./routes/auth";
import meRouter from "./routes/me";
import ingestRouter from "./routes/ingest";
import coursesRouter from "./routes/courses";
import meetingsRouter from "./routes/meetings";
import notificationsRouter from './routes/notifications';
import { startCronJobs } from './cron';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get("/", (req, res) => {
  res.send("Nupjuk backend running");
});

app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/ingest", ingestRouter);
app.use("/courses", coursesRouter);
app.use("/meetings", meetingsRouter);
app.use('/notifications', notificationsRouter);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startCronJobs(); // Start the cron jobs when the server starts
});