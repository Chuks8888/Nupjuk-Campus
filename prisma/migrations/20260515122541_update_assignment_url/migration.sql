/*
  Warnings:

  - A unique constraint covering the columns `[assignmentUrl]` on the table `Assignment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `assignmentUrl` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "assignmentUrl" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_assignmentUrl_key" ON "Assignment"("assignmentUrl");
