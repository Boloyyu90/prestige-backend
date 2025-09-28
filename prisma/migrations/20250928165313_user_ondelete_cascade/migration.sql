-- DropForeignKey
ALTER TABLE "public"."Token" DROP CONSTRAINT "Token_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_exams" DROP CONSTRAINT "user_exams_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."exam_questions" ALTER COLUMN "order_number" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."user_exams" ADD CONSTRAINT "user_exams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Token" ADD CONSTRAINT "Token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
