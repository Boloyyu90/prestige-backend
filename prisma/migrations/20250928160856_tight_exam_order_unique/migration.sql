/*
  Warnings:

  - Made the column `order_number` on table `exam_questions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."exam_questions" ALTER COLUMN "order_number" SET NOT NULL;
