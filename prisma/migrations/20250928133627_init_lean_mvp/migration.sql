-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "public"."ExamStatus" AS ENUM ('IN_PROGRESS', 'FINISHED', 'CANCELLED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('TIU', 'TKP', 'TWK');

-- CreateEnum
CREATE TYPE "public"."ProctoringEventType" AS ENUM ('FACE_NOT_DETECTED', 'MULTIPLE_FACES', 'PHONE_DETECTED');

-- CreateEnum
CREATE TYPE "public"."TokenType" AS ENUM ('ACCESS', 'REFRESH', 'RESET_PASSWORD', 'VERIFY_EMAIL');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'PARTICIPANT',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."question_bank" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct_answer" TEXT NOT NULL,
    "default_score" INTEGER NOT NULL DEFAULT 5,
    "question_type" "public"."QuestionType" NOT NULL DEFAULT 'TIU',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exams" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "shuffle_questions" BOOLEAN NOT NULL DEFAULT false,
    "shuffle_options" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exam_questions" (
    "id" SERIAL NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "order_number" INTEGER,
    "effective_score" INTEGER,

    CONSTRAINT "exam_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_exams" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "total_score" INTEGER,
    "status" "public"."ExamStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "face_not_detected_sec" INTEGER DEFAULT 0,
    "multiple_faces_count" INTEGER DEFAULT 0,
    "phone_detected_count" INTEGER DEFAULT 0,
    "cheating_score" DOUBLE PRECISION,

    CONSTRAINT "user_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."answers" (
    "id" SERIAL NOT NULL,
    "user_exam_id" INTEGER NOT NULL,
    "exam_question_id" INTEGER NOT NULL,
    "selected_answer" JSONB,
    "obtained_score" INTEGER,
    "is_correct" BOOLEAN,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."proctoring_events" (
    "id" SERIAL NOT NULL,
    "user_exam_id" INTEGER NOT NULL,
    "event_type" "public"."ProctoringEventType" NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "proctoring_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Token" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" "public"."TokenType" NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "question_bank_question_type_idx" ON "public"."question_bank"("question_type");

-- CreateIndex
CREATE INDEX "exams_created_by_idx" ON "public"."exams"("created_by");

-- CreateIndex
CREATE INDEX "exams_start_time_idx" ON "public"."exams"("start_time");

-- CreateIndex
CREATE INDEX "exam_questions_exam_id_idx" ON "public"."exam_questions"("exam_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_questions_exam_id_question_id_key" ON "public"."exam_questions"("exam_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_questions_exam_id_order_number_key" ON "public"."exam_questions"("exam_id", "order_number");

-- CreateIndex
CREATE INDEX "user_exams_user_id_status_idx" ON "public"."user_exams"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_exams_exam_id_status_idx" ON "public"."user_exams"("exam_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_exams_user_id_exam_id_attempt_number_key" ON "public"."user_exams"("user_id", "exam_id", "attempt_number");

-- CreateIndex
CREATE INDEX "answers_user_exam_id_answered_at_idx" ON "public"."answers"("user_exam_id", "answered_at");

-- CreateIndex
CREATE UNIQUE INDEX "answers_user_exam_id_exam_question_id_key" ON "public"."answers"("user_exam_id", "exam_question_id");

-- CreateIndex
CREATE INDEX "proctoring_events_user_exam_id_event_time_idx" ON "public"."proctoring_events"("user_exam_id", "event_time");

-- CreateIndex
CREATE INDEX "proctoring_events_event_type_event_time_idx" ON "public"."proctoring_events"("event_type", "event_time");

-- CreateIndex
CREATE INDEX "Token_user_id_idx" ON "public"."Token"("user_id");

-- CreateIndex
CREATE INDEX "Token_type_idx" ON "public"."Token"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Token_tokenHash_type_key" ON "public"."Token"("tokenHash", "type");

-- AddForeignKey
ALTER TABLE "public"."exams" ADD CONSTRAINT "exams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_questions" ADD CONSTRAINT "exam_questions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exam_questions" ADD CONSTRAINT "exam_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."question_bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_exams" ADD CONSTRAINT "user_exams_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_exams" ADD CONSTRAINT "user_exams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."answers" ADD CONSTRAINT "answers_exam_question_id_fkey" FOREIGN KEY ("exam_question_id") REFERENCES "public"."exam_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."answers" ADD CONSTRAINT "answers_user_exam_id_fkey" FOREIGN KEY ("user_exam_id") REFERENCES "public"."user_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proctoring_events" ADD CONSTRAINT "proctoring_events_user_exam_id_fkey" FOREIGN KEY ("user_exam_id") REFERENCES "public"."user_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Token" ADD CONSTRAINT "Token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
