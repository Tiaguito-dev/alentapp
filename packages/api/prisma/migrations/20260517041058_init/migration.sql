/*
  Warnings:

  - You are about to drop the column `sportId` on the `lockers` table. All the data in the column will be lost.
  - You are about to drop the column `sportId` on the `payments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "lockers" DROP CONSTRAINT "lockers_sportId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_sportId_fkey";

-- AlterTable
ALTER TABLE "lockers" DROP COLUMN "sportId";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "sportId";
