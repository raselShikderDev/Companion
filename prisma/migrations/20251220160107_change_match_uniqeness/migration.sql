/*
  Warnings:

  - A unique constraint covering the columns `[tripId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Match_tripId_key" ON "Match"("tripId");
