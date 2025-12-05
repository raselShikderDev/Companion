/*
  Warnings:

  - You are about to drop the column `requiredPerson` on the `Trip` table. All the data in the column will be lost.
  - Added the required column `tripId` to the `Match` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "tripId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "requiredPerson",
ADD COLUMN     "image" TEXT;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
