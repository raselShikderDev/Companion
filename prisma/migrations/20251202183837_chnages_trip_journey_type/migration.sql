/*
  Warnings:

  - The `journeyType` column on the `Trip` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "journeyType",
ADD COLUMN     "journeyType" TEXT[];
