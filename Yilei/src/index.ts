import express from "express";
import cors from "cors";
import path from 'path';
import http from 'http'; 
import { Server } from 'socket.io'; 

import authRouter from "./routes/auth";
import meRouter from "./routes/me";
import ingestRouter from "./routes/ingest";
import coursesRouter from "./routes/courses";
import meetingsRouter from "./routes/meetings";
import notificationsRouter from './routes/notifications';
import { startCronJobs } from './cron';

const app = express();

// Create a raw HTTP server and attach the Express app to it. This allows to 
// run both HTTP and WebSocket servers on the same port seamlessly.
const server = http.createServer(app);


// Initialize WebSocket server
const io = new Server(server, {
  cors: {
    origin: "*", // Attention: In production, you should specify the exact
                 //  origin(s) that are allowed to connect for security reasons.
    methods: ["GET", "POST"]
  }
});

// By attaching the io instance to the Express app, we can easily access it 
// in any route handler via req.app.get('io') to emit real-time events to clients.
app.set('io', io);

// WebSocket connection listener logic
io.on('connection', (socket) => {
  console.log('A user connected via WebSocket:', socket.id);

  // This allows us to emit meeting-specific updates only to users who are 
  // currently viewing that meeting's page.
  socket.on('joinMeeting', (meetingId) => {
    const roomName = `meeting_${meetingId}`;
    socket.join(roomName);
    console.log(`User ${socket.id} joined room: ${roomName}`);
  });

  // When a user logs in, the frontend will trigger this event to join their 
  // personal room for receiving notifications.
  socket.on('joinUserRoom', (userId) => {
    const roomName = `user_${userId}`;
    socket.join(roomName);
    console.log(`User ${socket.id} joined personal notification room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get("/", (req, res) => {
  res.send("Nupjuk backend running with WebSockets");
});

app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/ingest", ingestRouter);
app.use("/courses", coursesRouter);
app.use("/meetings", meetingsRouter);
app.use('/notifications', notificationsRouter);

const PORT = 3000;

// Use server.listen
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startCronJobs(io); 
});