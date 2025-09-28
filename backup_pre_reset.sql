--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ExamStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ExamStatus" AS ENUM (
    'IN_PROGRESS',
    'FINISHED',
    'CANCELLED',
    'TIMEOUT'
);


ALTER TYPE public."ExamStatus" OWNER TO postgres;

--
-- Name: ProctoringEventType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProctoringEventType" AS ENUM (
    'FACE_NOT_DETECTED',
    'MULTIPLE_FACES',
    'PHONE_DETECTED'
);


ALTER TYPE public."ProctoringEventType" OWNER TO postgres;

--
-- Name: QuestionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."QuestionType" AS ENUM (
    'TIU',
    'TKP',
    'TWK'
);


ALTER TYPE public."QuestionType" OWNER TO postgres;

--
-- Name: TokenType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TokenType" AS ENUM (
    'ACCESS',
    'REFRESH',
    'RESET_PASSWORD',
    'VERIFY_EMAIL'
);


ALTER TYPE public."TokenType" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'PARTICIPANT'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.answers (
    id integer NOT NULL,
    user_exam_id integer NOT NULL,
    exam_question_id integer NOT NULL,
    is_correct boolean,
    answered_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    obtained_score integer,
    selected_answer jsonb
);


ALTER TABLE public.answers OWNER TO postgres;

--
-- Name: answers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.answers_id_seq OWNER TO postgres;

--
-- Name: answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.answers_id_seq OWNED BY public.answers.id;


--
-- Name: exam_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam_questions (
    id integer NOT NULL,
    exam_id integer NOT NULL,
    question_id integer NOT NULL,
    order_number integer,
    effective_score integer
);


ALTER TABLE public.exam_questions OWNER TO postgres;

--
-- Name: exam_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exam_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exam_questions_id_seq OWNER TO postgres;

--
-- Name: exam_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exam_questions_id_seq OWNED BY public.exam_questions.id;


--
-- Name: exams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exams (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    start_time timestamp(3) without time zone,
    end_time timestamp(3) without time zone,
    duration_minutes integer,
    created_by integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    shuffle_options boolean DEFAULT false NOT NULL,
    shuffle_questions boolean DEFAULT false NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.exams OWNER TO postgres;

--
-- Name: exams_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exams_id_seq OWNER TO postgres;

--
-- Name: exams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exams_id_seq OWNED BY public.exams.id;


--
-- Name: proctoring_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proctoring_events (
    id integer NOT NULL,
    user_exam_id integer NOT NULL,
    event_type public."ProctoringEventType" NOT NULL,
    event_time timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb
);


ALTER TABLE public.proctoring_events OWNER TO postgres;

--
-- Name: proctoring_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proctoring_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proctoring_events_id_seq OWNER TO postgres;

--
-- Name: proctoring_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proctoring_events_id_seq OWNED BY public.proctoring_events.id;


--
-- Name: question_bank; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_bank (
    id integer NOT NULL,
    content text NOT NULL,
    options jsonb NOT NULL,
    correct_answer text NOT NULL,
    default_score integer DEFAULT 5 NOT NULL,
    question_type public."QuestionType" DEFAULT 'TIU'::public."QuestionType" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.question_bank OWNER TO postgres;

--
-- Name: question_bank_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.question_bank_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_bank_id_seq OWNER TO postgres;

--
-- Name: question_bank_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.question_bank_id_seq OWNED BY public.question_bank.id;


--
-- Name: tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tokens (
    id integer NOT NULL,
    "tokenHash" text NOT NULL,
    type public."TokenType" NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    blacklisted boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.tokens OWNER TO postgres;

--
-- Name: tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tokens_id_seq OWNER TO postgres;

--
-- Name: tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tokens_id_seq OWNED BY public.tokens.id;


--
-- Name: user_exams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_exams (
    id integer NOT NULL,
    user_id integer NOT NULL,
    exam_id integer NOT NULL,
    started_at timestamp(3) without time zone,
    finished_at timestamp(3) without time zone,
    total_score integer,
    status public."ExamStatus" DEFAULT 'IN_PROGRESS'::public."ExamStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    attempt_number integer DEFAULT 1 NOT NULL,
    cheating_score double precision,
    face_not_detected_sec integer DEFAULT 0,
    multiple_faces_count integer DEFAULT 0,
    phone_detected_count integer DEFAULT 0,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_exams OWNER TO postgres;

--
-- Name: user_exams_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_exams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_exams_id_seq OWNER TO postgres;

--
-- Name: user_exams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_exams_id_seq OWNED BY public.user_exams.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."UserRole" DEFAULT 'PARTICIPANT'::public."UserRole" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    "isEmailVerified" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: answers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers ALTER COLUMN id SET DEFAULT nextval('public.answers_id_seq'::regclass);


--
-- Name: exam_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_questions ALTER COLUMN id SET DEFAULT nextval('public.exam_questions_id_seq'::regclass);


--
-- Name: exams id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams ALTER COLUMN id SET DEFAULT nextval('public.exams_id_seq'::regclass);


--
-- Name: proctoring_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proctoring_events ALTER COLUMN id SET DEFAULT nextval('public.proctoring_events_id_seq'::regclass);


--
-- Name: question_bank id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_bank ALTER COLUMN id SET DEFAULT nextval('public.question_bank_id_seq'::regclass);


--
-- Name: tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens ALTER COLUMN id SET DEFAULT nextval('public.tokens_id_seq'::regclass);


--
-- Name: user_exams id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exams ALTER COLUMN id SET DEFAULT nextval('public.user_exams_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
6f2e05c6-4501-42b5-89df-4344077d1682	21ed1c24015943d2f6a027b5dc0d9decbeaf8d628072ff921a036c4d869cd543	2025-09-28 20:08:09.461369+07	20250901085542_mvp_tryout_system_schema	\N	\N	2025-09-28 20:08:09.424435+07	1
7613a85f-2dd6-4092-8818-ae05dcf1c5b8	f52b9fd62a6b96f341114aeb8c8174c0ec0ed2c71a830bcf994d322a169c0727	2025-09-28 20:08:09.463302+07	20250901101220_add_is_email_verified_to_user	\N	\N	2025-09-28 20:08:09.461701+07	1
b6ca01b9-4e62-4c7d-a9a6-7a90314f9654	2739948eadfb58a3f96d75769b0dc0292a548c06f33a1c34b2faeeb29e86a7ae	2025-09-28 20:08:09.466076+07	20250903070124_add_token_hash_column	\N	\N	2025-09-28 20:08:09.463728+07	1
0fe8ac2c-9534-4c8c-bc26-08e73c191599	9a688058e5190367a2c87772034d265a30e4e9657e23c6c2b2d9d8af4e9f575c	2025-09-28 20:08:09.467984+07	20250905060706_drop_score_override	\N	\N	2025-09-28 20:08:09.466532+07	1
8fe6d644-2acf-412c-b61a-af4db94f0f3f	7999f7a348593a2052bffa13731519619e6a6aa9198d9fd0b62cf842b35fcfdc	2025-09-28 20:08:18.239316+07	20250928130813_refactor_exam_system_v2	\N	\N	2025-09-28 20:08:18.211183+07	1
\.


--
-- Data for Name: answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.answers (id, user_exam_id, exam_question_id, is_correct, answered_at, obtained_score, selected_answer) FROM stdin;
\.


--
-- Data for Name: exam_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exam_questions (id, exam_id, question_id, order_number, effective_score) FROM stdin;
\.


--
-- Data for Name: exams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exams (id, title, description, start_time, end_time, duration_minutes, created_by, created_at, shuffle_options, shuffle_questions, updated_at) FROM stdin;
\.


--
-- Data for Name: proctoring_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proctoring_events (id, user_exam_id, event_type, event_time, metadata) FROM stdin;
\.


--
-- Data for Name: question_bank; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_bank (id, content, options, correct_answer, default_score, question_type, created_at) FROM stdin;
\.


--
-- Data for Name: tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tokens (id, "tokenHash", type, expires, blacklisted, created_at, user_id) FROM stdin;
\.


--
-- Data for Name: user_exams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_exams (id, user_id, exam_id, started_at, finished_at, total_score, status, created_at, attempt_number, cheating_score, face_not_detected_sec, multiple_faces_count, phone_detected_count, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, created_at, updated_at, "isEmailVerified") FROM stdin;
\.


--
-- Name: answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.answers_id_seq', 1, false);


--
-- Name: exam_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exam_questions_id_seq', 1, false);


--
-- Name: exams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exams_id_seq', 1, false);


--
-- Name: proctoring_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proctoring_events_id_seq', 1, false);


--
-- Name: question_bank_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_bank_id_seq', 1, false);


--
-- Name: tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tokens_id_seq', 1, false);


--
-- Name: user_exams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_exams_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (id);


--
-- Name: exam_questions exam_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_questions
    ADD CONSTRAINT exam_questions_pkey PRIMARY KEY (id);


--
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- Name: proctoring_events proctoring_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proctoring_events
    ADD CONSTRAINT proctoring_events_pkey PRIMARY KEY (id);


--
-- Name: question_bank question_bank_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_bank
    ADD CONSTRAINT question_bank_pkey PRIMARY KEY (id);


--
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (id);


--
-- Name: user_exams user_exams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exams
    ADD CONSTRAINT user_exams_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: answers_user_exam_id_answered_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX answers_user_exam_id_answered_at_idx ON public.answers USING btree (user_exam_id, answered_at);


--
-- Name: answers_user_exam_id_exam_question_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX answers_user_exam_id_exam_question_id_key ON public.answers USING btree (user_exam_id, exam_question_id);


--
-- Name: exam_questions_exam_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX exam_questions_exam_id_idx ON public.exam_questions USING btree (exam_id);


--
-- Name: exam_questions_exam_id_order_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX exam_questions_exam_id_order_number_key ON public.exam_questions USING btree (exam_id, order_number);


--
-- Name: exam_questions_exam_id_question_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX exam_questions_exam_id_question_id_key ON public.exam_questions USING btree (exam_id, question_id);


--
-- Name: exams_created_by_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX exams_created_by_idx ON public.exams USING btree (created_by);


--
-- Name: exams_start_time_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX exams_start_time_idx ON public.exams USING btree (start_time);


--
-- Name: proctoring_events_event_type_event_time_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX proctoring_events_event_type_event_time_idx ON public.proctoring_events USING btree (event_type, event_time);


--
-- Name: proctoring_events_user_exam_id_event_time_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX proctoring_events_user_exam_id_event_time_idx ON public.proctoring_events USING btree (user_exam_id, event_time);


--
-- Name: question_bank_question_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX question_bank_question_type_idx ON public.question_bank USING btree (question_type);


--
-- Name: tokens_tokenHash_type_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "tokens_tokenHash_type_key" ON public.tokens USING btree ("tokenHash", type);


--
-- Name: tokens_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tokens_type_idx ON public.tokens USING btree (type);


--
-- Name: tokens_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tokens_user_id_idx ON public.tokens USING btree (user_id);


--
-- Name: user_exams_exam_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_exams_exam_id_status_idx ON public.user_exams USING btree (exam_id, status);


--
-- Name: user_exams_user_id_exam_id_attempt_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_exams_user_id_exam_id_attempt_number_key ON public.user_exams USING btree (user_id, exam_id, attempt_number);


--
-- Name: user_exams_user_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_exams_user_id_status_idx ON public.user_exams USING btree (user_id, status);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: answers answers_exam_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_exam_question_id_fkey FOREIGN KEY (exam_question_id) REFERENCES public.exam_questions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: answers answers_user_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_user_exam_id_fkey FOREIGN KEY (user_exam_id) REFERENCES public.user_exams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: exam_questions exam_questions_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_questions
    ADD CONSTRAINT exam_questions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: exam_questions exam_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_questions
    ADD CONSTRAINT exam_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.question_bank(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: exams exams_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: proctoring_events proctoring_events_user_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proctoring_events
    ADD CONSTRAINT proctoring_events_user_exam_id_fkey FOREIGN KEY (user_exam_id) REFERENCES public.user_exams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tokens tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_exams user_exams_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exams
    ADD CONSTRAINT user_exams_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_exams user_exams_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exams
    ADD CONSTRAINT user_exams_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

