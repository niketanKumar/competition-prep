-- ============================================================================
-- HomeoPrep — Supabase Database Schema & Setup Script
-- Paste this entire script into your Supabase SQL Editor and click "Run"
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Student',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
  id BIGSERIAL PRIMARY KEY,
  q TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of 4 strings
  correct INT,                              -- 0-based index (0, 1, 2, 3) or NULL
  subject TEXT NOT NULL,                     -- e.g. 'materia-medica', 'organon'
  year INT,                                 -- e.g. 2025
  group_id TEXT,                            -- e.g. 'PYQ-2025'
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  verified BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  exp TEXT,                                 -- Explanation
  ai_generated_exp BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast subject and year filtering
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_year ON public.questions(year);
CREATE INDEX IF NOT EXISTS idx_questions_group ON public.questions(group_id);

-- 4. FLASHCARDS TABLE
CREATE TABLE IF NOT EXISTS public.flashcards (
  id TEXT PRIMARY KEY,                       -- e.g. 'f1'
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  subject TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. FLASHCARD REVIEWS (Per User Spaced Repetition State)
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  flashcard_id TEXT NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  repetitions INT DEFAULT 0,
  ease_factor FLOAT DEFAULT 2.5,
  interval INT DEFAULT 0,
  next_review TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, flashcard_id)
);

-- 6. TEST SESSIONS (Completed Mock Tests & Practice Sessions)
CREATE TABLE IF NOT EXISTS public.test_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('full', 'subject', 'practice')),
  subject TEXT,
  score INT NOT NULL,
  total INT NOT NULL,
  pct INT NOT NULL,
  correct INT NOT NULL,
  wrong INT NOT NULL,
  skipped INT NOT NULL,
  time_taken INT NOT NULL,                 -- Seconds
  responses JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. USER PROGRESS & STREAKS TABLE
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_study_date DATE,
  total_answered INT DEFAULT 0,
  total_correct INT DEFAULT 0,
  exam_date DATE,
  study_plan JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Questions: Everyone can read, only Admins can insert/update/delete
CREATE POLICY "Questions read all" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Questions admin write" ON public.questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Flashcards: Everyone can read, only Admins write
CREATE POLICY "Flashcards read all" ON public.flashcards FOR SELECT USING (true);
CREATE POLICY "Flashcards admin write" ON public.flashcards FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- User Reviews & Sessions: Users read/write their own
CREATE POLICY "Reviews own" ON public.flashcard_reviews FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Sessions own" ON public.test_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Progress own" ON public.user_progress FOR ALL USING (user_id = auth.uid());

-- User Profile: Users read all (for leaderboard), write own
CREATE POLICY "Users read all" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users write own" ON public.users FOR UPDATE USING (id = auth.uid());

-- ============================================================================
-- AUTOMATIC USER CREATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  INSERT INTO public.user_progress (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Success Message
SELECT 'HomeoPrep database schema successfully created!' AS status;
