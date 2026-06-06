-- Align existing migrations with the Prisma schema used by the backend routes.

-- Personal events are read/written with status and timestamp columns.
ALTER TABLE "PersonalEvent"
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'todo',
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Assignment status is tracked per user and assignment in the current schema.
CREATE TABLE IF NOT EXISTS "UserAssignmentStatus" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "assignmentId" INTEGER NOT NULL,
  "klmsSubmissionStatus" TEXT,
  "userCompletionStatus" TEXT NOT NULL DEFAULT 'todo',
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserAssignmentStatus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserAssignmentStatus_userId_assignmentId_key"
  ON "UserAssignmentStatus"("userId", "assignmentId");

ALTER TABLE "UserAssignmentStatus"
  ADD CONSTRAINT "UserAssignmentStatus_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserAssignmentStatus"
  ADD CONSTRAINT "UserAssignmentStatus_assignmentId_fkey"
  FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- The current Prisma schema expects MeetingParticipant.id plus a unique pair.
ALTER TABLE "MeetingParticipant"
  ADD COLUMN IF NOT EXISTS "id" SERIAL;

ALTER TABLE "MeetingParticipant"
  DROP CONSTRAINT IF EXISTS "MeetingParticipant_pkey";

ALTER TABLE "MeetingParticipant"
  ADD CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id");

CREATE UNIQUE INDEX IF NOT EXISTS "MeetingParticipant_meetingEventId_userId_key"
  ON "MeetingParticipant"("meetingEventId", "userId");
