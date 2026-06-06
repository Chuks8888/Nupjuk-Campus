import { IncomingMessage, Server } from "http";
import jwt from "jsonwebtoken";
import { WebSocket, WebSocketServer } from "ws";
import { prisma } from "./db";

type RealtimeClient = WebSocket & {
  userId?: number;
  meetingIds: Set<number>;
};

let wss: WebSocketServer | null = null;

function sendJson(client: WebSocket, payload: unknown) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(payload));
  }
}

function getUserId(req: IncomingMessage) {
  const url = new URL(req.url || "", "http://localhost");
  const token = url.searchParams.get("token");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

async function canJoinMeeting(userId: number, meetingId: number) {
  const meeting = await prisma.meetingEvent.findUnique({
    where: { id: meetingId },
    select: { courseId: true },
  });

  if (!meeting) return false;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: meeting.courseId } },
  });

  return !!(
    enrollment &&
    enrollment.status === "active" &&
    enrollment.validUntil >= new Date()
  );
}

export function setupRealtime(server: Server) {
  wss = new WebSocketServer({ server, path: "/realtime" });

  wss.on("connection", (socket, req) => {
    const client = socket as RealtimeClient;
    const userId = getUserId(req);

    if (!userId) {
      socket.close(1008, "Unauthorized");
      return;
    }

    client.userId = userId;
    client.meetingIds = new Set();

    client.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString()) as {
          type?: string;
          meetingId?: number | string;
        };
        const meetingId = Number(message.meetingId);

        if (message.type === "join_meeting" && meetingId) {
          if (!(await canJoinMeeting(userId, meetingId))) {
            sendJson(client, { type: "error", message: "Meeting access denied." });
            return;
          }

          client.meetingIds.add(meetingId);
          sendJson(client, { type: "joined_meeting", meetingId });
        }

        if (message.type === "leave_meeting" && meetingId) {
          client.meetingIds.delete(meetingId);
        }
      } catch {
        sendJson(client, { type: "error", message: "Invalid realtime message." });
      }
    });
  });
}

export function broadcastMeetingUpdate(meetingId: number) {
  if (!wss) return;

  wss.clients.forEach((socket) => {
    const client = socket as RealtimeClient;
    if (client.meetingIds?.has(meetingId)) {
      sendJson(client, { type: "meeting_updated", meetingId });
    }
  });
}
