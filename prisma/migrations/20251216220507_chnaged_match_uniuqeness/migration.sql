/*
  Warnings:

  - A unique constraint covering the columns `[requesterId,recipientId,tripId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Match_requesterId_recipientId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Match_requesterId_recipientId_tripId_key" ON "Match"("requesterId", "recipientId", "tripId");
