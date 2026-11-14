
-- Core academic structure
CREATE TABLE public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.institutions TO anon, authenticated;
GRANT ALL ON public.institutions TO service_role;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "institutions readable" ON public.institutions FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL
);
GRANT SELECT ON public.departments TO anon, authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments readable" ON public.departments FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text
);
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses readable" ON public.courses FOR SELECT TO anon, authenticated USING (true);

-- Profiles (id = auth user id for real users; seeded classmates have no login)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  full_name text NOT NULL DEFAULT 'Student',
  major text,
  grad_year int,
  role_title text,
  avatar_url text,
  bio text,
  onboarded boolean NOT NULL DEFAULT false,
  studying_course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  studying_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Student'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.enrollments (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);
GRANT SELECT ON public.enrollments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments readable" ON public.enrollments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "manage own enrollments ins" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "manage own enrollments upd" ON public.enrollments FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "manage own enrollments del" ON public.enrollments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Questions & answers
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 8 AND 200),
  body text NOT NULL DEFAULT '' CHECK (char_length(body) <= 5000),
  tag text CHECK (tag IS NULL OR char_length(tag) <= 40),
  accepted_answer_id uuid,
  answer_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX questions_course_idx ON public.questions(course_id, created_at DESC);
GRANT SELECT ON public.questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions readable" ON public.questions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ask as self" ON public.questions FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "edit own question" ON public.questions FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "delete own question" ON public.questions FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  parent_answer_id uuid REFERENCES public.answers(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  upvotes int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX answers_question_idx ON public.answers(question_id);
ALTER TABLE public.questions ADD CONSTRAINT questions_accepted_fk FOREIGN KEY (accepted_answer_id) REFERENCES public.answers(id) ON DELETE SET NULL;
GRANT SELECT ON public.answers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.answers TO authenticated;
GRANT ALL ON public.answers TO service_role;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "answers readable" ON public.answers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "answer as self" ON public.answers FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "delete own answer" ON public.answers FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE TABLE public.votes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answer_id uuid NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, answer_id)
);
GRANT SELECT, INSERT, DELETE ON public.votes TO authenticated;
GRANT ALL ON public.votes TO service_role;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see own votes" ON public.votes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "vote as self" ON public.votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "unvote own" ON public.votes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.bookmarks (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);
GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bookmarks sel" ON public.bookmarks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own bookmarks ins" ON public.bookmarks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own bookmarks del" ON public.bookmarks FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.helper_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  helper_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, helper_id)
);
GRANT SELECT, INSERT ON public.helper_invites TO authenticated;
GRANT ALL ON public.helper_invites TO service_role;
ALTER TABLE public.helper_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see related invites" ON public.helper_invites FOR SELECT TO authenticated USING (inviter_id = auth.uid() OR helper_id = auth.uid());
CREATE POLICY "invite as self" ON public.helper_invites FOR INSERT TO authenticated WITH CHECK (inviter_id = auth.uid() AND helper_id <> auth.uid());

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('answer','invite','accepted')),
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "mark own read" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Triggers
CREATE OR REPLACE FUNCTION public.on_vote_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.answers SET upvotes = upvotes + 1 WHERE id = NEW.answer_id;
  ELSE
    UPDATE public.answers SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.answer_id;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER votes_count AFTER INSERT OR DELETE ON public.votes FOR EACH ROW EXECUTE FUNCTION public.on_vote_change();

CREATE OR REPLACE FUNCTION public.on_answer_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q_author uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.parent_answer_id IS NULL THEN
      UPDATE public.questions SET answer_count = answer_count + 1 WHERE id = NEW.question_id RETURNING author_id INTO q_author;
    ELSE
      SELECT author_id INTO q_author FROM public.questions WHERE id = NEW.question_id;
    END IF;
    IF q_author IS NOT NULL AND q_author <> NEW.author_id THEN
      INSERT INTO public.notifications (user_id, actor_id, type, question_id) VALUES (q_author, NEW.author_id, 'answer', NEW.question_id);
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_answer_id IS NULL THEN
    UPDATE public.questions SET answer_count = GREATEST(answer_count - 1, 0) WHERE id = OLD.question_id;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER answers_count AFTER INSERT OR DELETE ON public.answers FOR EACH ROW EXECUTE FUNCTION public.on_answer_change();

CREATE OR REPLACE FUNCTION public.on_invite_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type, question_id) VALUES (NEW.helper_id, NEW.inviter_id, 'invite', NEW.question_id);
  RETURN NULL;
END; $$;
CREATE TRIGGER invites_notify AFTER INSERT ON public.helper_invites FOR EACH ROW EXECUTE FUNCTION public.on_invite_created();

CREATE OR REPLACE FUNCTION public.on_question_accept()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a_author uuid; a_q uuid;
BEGIN
  IF NEW.accepted_answer_id IS NOT NULL AND NEW.accepted_answer_id IS DISTINCT FROM OLD.accepted_answer_id THEN
    SELECT author_id, question_id INTO a_author, a_q FROM public.answers WHERE id = NEW.accepted_answer_id;
    IF a_q IS DISTINCT FROM NEW.id THEN
      RAISE EXCEPTION 'Accepted answer must belong to this question';
    END IF;
    IF a_author <> NEW.author_id THEN
      INSERT INTO public.notifications (user_id, actor_id, type, question_id) VALUES (a_author, NEW.author_id, 'accepted', NEW.id);
    END IF;
  END IF;
  -- protect counters from client edits
  NEW.answer_count := OLD.answer_count;
  RETURN NEW;
END; $$;
CREATE TRIGGER questions_accept BEFORE UPDATE ON public.questions FOR EACH ROW
  WHEN (current_setting('role', true) IS DISTINCT FROM 'service_role' AND pg_trigger_depth() = 0)
  EXECUTE FUNCTION public.on_question_accept();

-- Seed data
INSERT INTO public.institutions (id, name, short_name) VALUES
 ('11111111-0000-0000-0000-000000000001', 'Trinity College', 'Trinity'),
 ('11111111-0000-0000-0000-000000000002', 'Northbridge University', 'Northbridge');

INSERT INTO public.departments (id, institution_id, name, code) VALUES
 ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Computer Science', 'CS'),
 ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Mathematics', 'MATH'),
 ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 'Computer Science', 'CS');

INSERT INTO public.courses (id, institution_id, department_id, code, name, description) VALUES
 ('c0000000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'CS 204', 'Linear Algebra', 'Vectors, matrices, eigenvalues and linear maps for computing.'),
 ('c0000000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'CS 210', 'Algorithms', 'Design and analysis of algorithms, complexity and divide-and-conquer.'),
 ('c0000000-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 'MATH 150', 'Discrete Math', 'Logic, proofs, induction, combinatorics and graphs.'),
 ('c0000000-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'CS 340', 'Distributed Systems', 'Consensus, replication, fault tolerance and clocks.'),
 ('c0000000-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000003', 'COMP 101', 'Intro to Programming', 'Foundations of programming in Python.');

INSERT INTO public.profiles (id, institution_id, full_name, major, grad_year, role_title, avatar_url, onboarded, studying_course_id, studying_until) VALUES
 ('a0000000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Leo Kim', 'CS', 2027, NULL, 'asset:leo', true, NULL, NULL),
 ('a0000000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Amara Okafor', 'CS', 2026, NULL, 'asset:amara', true, NULL, NULL),
 ('a0000000-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'Sarah Vance', 'CS', 2025, 'Peer Tutor', 'asset:sarah', true, NULL, NULL),
 ('a0000000-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', 'Marcus Chen', 'Math', 2026, NULL, 'asset:marcus', true, NULL, NULL),
 ('a0000000-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'Priya Nair', 'CS', 2027, NULL, 'asset:priya', true, 'c0000000-0000-0000-0000-000000000001', now() + interval '3650 days'),
 ('a0000000-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001', 'Jonah Reyes', 'CS', 2026, NULL, 'asset:jonah', true, 'c0000000-0000-0000-0000-000000000001', now() + interval '3650 days'),
 ('a0000000-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001', 'Mei Tanaka', 'Math', 2027, NULL, 'asset:mei', true, 'c0000000-0000-0000-0000-000000000001', now() + interval '3650 days'),
 ('a0000000-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000001', 'Diego Alvarez', 'CS', 2028, NULL, NULL, true, 'c0000000-0000-0000-0000-000000000001', now() + interval '3650 days'),
 ('a0000000-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000001', 'Hannah Brooks', 'CS', 2027, NULL, NULL, true, 'c0000000-0000-0000-0000-000000000001', now() + interval '3650 days'),
 ('a0000000-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000001', 'Omar Haddad', 'CS', 2026, NULL, NULL, true, 'c0000000-0000-0000-0000-000000000001', now() + interval '3650 days'),
 ('a0000000-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000001', 'Zoe Whitfield', 'Math', 2027, NULL, NULL, true, 'c0000000-0000-0000-0000-000000000001', now() + interval '3650 days'),
 ('a0000000-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000001', 'Kwame Mensah', 'CS', 2028, NULL, NULL, true, 'c0000000-0000-0000-0000-000000000001', now() + interval '3650 days'),
 ('a0000000-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000001', 'Lucia Romero', 'CS', 2027, NULL, NULL, true, 'c0000000-0000-0000-0000-000000000001', now() + interval '3650 days'),
 ('a0000000-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000001', 'Ethan Park', 'CS', 2026, NULL, NULL, true, 'c0000000-0000-0000-0000-000000000001', now() + interval '3650 days'),
 ('a0000000-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000001', 'Nadia Petrov', 'Math', 2028, NULL, NULL, true, 'c0000000-0000-0000-0000-000000000001', now() + interval '3650 days'),
 ('a0000000-0000-0000-0000-000000000016', '11111111-0000-0000-0000-000000000001', 'Sam Okoro', 'CS', 2027, NULL, NULL, true, 'c0000000-0000-0000-0000-000000000001', now() + interval '3650 days'),
 ('a0000000-0000-0000-0000-000000000017', '11111111-0000-0000-0000-000000000001', 'Ines Duarte', 'CS', 2027, NULL, NULL, true, 'c0000000-0000-0000-0000-000000000001', now() + interval '3650 days'),
 ('a0000000-0000-0000-0000-000000000018', '11111111-0000-0000-0000-000000000001', 'Theo Grant', 'CS', 2026, NULL, NULL, true, 'c0000000-0000-0000-0000-000000000001', now() + interval '3650 days'),
 ('a0000000-0000-0000-0000-000000000019', '11111111-0000-0000-0000-000000000001', 'Aisha Rahman', 'CS', 2028, NULL, NULL, true, 'c0000000-0000-0000-0000-000000000004', now() + interval '3650 days'),
 ('a0000000-0000-0000-0000-000000000020', '11111111-0000-0000-0000-000000000001', 'Ben Lowe', 'Math', 2027, NULL, NULL, true, 'c0000000-0000-0000-0000-000000000003', now() + interval '3650 days');

INSERT INTO public.enrollments (user_id, course_id, status) VALUES
 ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'completed'),
 ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'completed'),
 ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'completed'),
 ('a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'completed'),
 ('a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'completed'),
 ('a0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'completed'),
 ('a0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004', 'completed'),
 ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'enrolled'),
 ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'enrolled'),
 ('a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'enrolled'),
 ('a0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 'enrolled'),
 ('a0000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000004', 'enrolled');

INSERT INTO public.questions (id, author_id, institution_id, course_id, title, body, tag, created_at) VALUES
 ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
  'Can someone explain eigenvectors intuitively with a 2D shear matrix?',
  'I understand Av = λv algebraically, but visually when we shear [[1, 2], [0, 1]], which direction stays fixed and why is there only one line of eigenvectors?',
  'Midterm Prep', now() - interval '2 hours'),
 ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
  'Algorithm complexity: Why is finding median of medians O(n)?',
  'I get that we split into groups of 5 and recurse on the medians, but the recurrence T(n) ≤ T(n/5) + T(7n/10) + O(n) looks like it should be n log n. Why does it collapse to linear?',
  'Problem Set 4', now() - interval '5 hours'),
 ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003',
  'When do I need strong induction instead of regular induction?',
  'For proving every integer n ≥ 2 is a product of primes, my TA said ordinary induction fails. What exactly breaks if I only assume P(n) to prove P(n+1)?',
  'Proof Help', now() - interval '1 day'),
 ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000019', '11111111-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004',
  'Raft vs Paxos: why does Raft need a leader term number at all?',
  'If only one leader can win a majority vote, why can''t followers just trust whoever sends heartbeats? What goes wrong during a network partition without terms?',
  'Exam Review', now() - interval '3 hours'),
 ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000020', '11111111-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003',
  'Pigeonhole principle: how many socks to guarantee a matching pair of 4 colors?',
  'Is the answer 5 because there are 4 colors? I keep second-guessing whether it should be 8.',
  NULL, now() - interval '40 minutes');

INSERT INTO public.answers (id, question_id, parent_answer_id, author_id, body, upvotes, created_at) VALUES
 ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', NULL, 'a0000000-0000-0000-0000-000000000003',
  'Visualize a deck of playing cards pushed sideways. Vectors along the bottom edge (x-axis) never rotate, so direction is preserved with eigenvalue **λ = 1**. Any other vector tilts!', 28, now() - interval '100 minutes'),
 ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', NULL, 'a0000000-0000-0000-0000-000000000004',
  'Only **(1, 0)** survives: (A − I)v = 0 gives y = 0, one repeated λ.', 5, now() - interval '90 minutes'),
 ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', NULL, 'a0000000-0000-0000-0000-000000000005',
  'Algebraic multiplicity is 2 but geometric multiplicity is 1, so the matrix is defective and you can''t diagonalize it. That is exactly why you only see one line.', 3, now() - interval '60 minutes'),
 ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
  'The card deck picture finally made it click, thank you!', 0, now() - interval '80 minutes'),
 ('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000006',
  'Same idea works for any shear: the axis you shear along is the eigenvector.', 0, now() - interval '70 minutes'),
 ('d0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000007',
  'Saving this for the midterm.', 0, now() - interval '50 minutes'),
 ('d0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', NULL, 'a0000000-0000-0000-0000-000000000006',
  'The trick is 1/5 + 7/10 = 9/10 < 1. Each level of recursion does a constant fraction less work, so the total is a geometric series: cn(1 + 0.9 + 0.81 + …) = 10cn = O(n).', 17, now() - interval '4 hours'),
 ('d0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004', NULL, 'a0000000-0000-0000-0000-000000000006',
  'Terms act like a logical clock. After a partition heals, an old leader may still send heartbeats; followers reject it because its term is stale. Without terms two "leaders" could both append entries.', 9, now() - interval '2 hours');

UPDATE public.questions SET answer_count = 3, accepted_answer_id = 'd0000000-0000-0000-0000-000000000001' WHERE id = 'b0000000-0000-0000-0000-000000000001';
UPDATE public.questions SET answer_count = 1, accepted_answer_id = 'd0000000-0000-0000-0000-000000000007' WHERE id = 'b0000000-0000-0000-0000-000000000002';
UPDATE public.questions SET answer_count = 1 WHERE id = 'b0000000-0000-0000-0000-000000000004';
