/*
  Warnings:

  - You are about to alter the column `title` on the `exams` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - You are about to drop the column `tokenHash` on the `tokens` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token_hash,type]` on the table `tokens` will be added. If there are existing duplicate values, this will fail.
  - Made the column `order_number` on table `exam_questions` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `correct_answer` on the `question_bank` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `token_hash` to the `tokens` table without a default value. This is not possible if the table is not empty.
  - Made the column `face_not_detected_sec` on table `user_exams` required. This step will fail if there are existing NULL values in that column.
  - Made the column `multiple_faces_count` on table `user_exams` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone_detected_count` on table `user_exams` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."exams" DROP CONSTRAINT "exams_created_by_fkey";

-- DropIndex
DROP INDEX "public"."tokens_tokenHash_type_key";

-- AlterTable
ALTER TABLE "public"."exam_questions" ALTER COLUMN "order_number" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."exams" ALTER COLUMN "title" SET DATA TYPE VARCHAR(200);

-- AlterTable
ALTER TABLE "public"."question_bank" DROP COLUMN "correct_answer",
ADD COLUMN     "correct_answer" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "public"."tokens" DROP COLUMN "tokenHash",
ADD COLUMN     "token_hash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."user_exams" ALTER COLUMN "face_not_detected_sec" SET NOT NULL,
ALTER COLUMN "multiple_faces_count" SET NOT NULL,
ALTER COLUMN "phone_detected_count" SET NOT NULL;

-- CreateIndex
CREATE INDEX "answers_exam_question_id_idx" ON "public"."answers"("exam_question_id");

-- CreateIndex
CREATE INDEX "exams_end_time_idx" ON "public"."exams"("end_time");

-- CreateIndex
CREATE INDEX "tokens_expires_idx" ON "public"."tokens"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_hash_type_key" ON "public"."tokens"("token_hash", "type");

-- AddForeignKey
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
