-- 007_courses_and_enrollments.sql
-- BITC Skills Vault: Courses catalog & user enrollments schema

-- 1. Courses Table (Published by Business/Studio & Admin accounts)
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Creative Direction',
    level TEXT DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
    duration TEXT DEFAULT '2-3 Hours',
    summary TEXT,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT DEFAULT 'Studio Masterclass',
    lessons_count INTEGER DEFAULT 1,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Anyone can view courses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'courses' AND policyname = 'Anyone can view courses'
    ) THEN
        CREATE POLICY "Anyone can view courses"
            ON public.courses FOR SELECT
            USING (true);
    END IF;
END $$;

-- Businesses and Admins can create courses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'courses' AND policyname = 'Businesses and Admins can create courses'
    ) THEN
        CREATE POLICY "Businesses and Admins can create courses"
            ON public.courses FOR INSERT
            WITH CHECK (
                auth.uid() IS NOT NULL AND (
                    EXISTS (
                        SELECT 1 FROM public.profiles
                        WHERE id = auth.uid() AND (role = 'business' OR role = 'admin')
                    ) OR auth.uid() = author_id
                )
            );
    END IF;
END $$;

-- Authors can update their own courses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'courses' AND policyname = 'Authors can update own courses'
    ) THEN
        CREATE POLICY "Authors can update own courses"
            ON public.courses FOR UPDATE
            USING (auth.uid() = author_id);
    END IF;
END $$;

-- 2. Course Enrollments Table (User-scoped enrollments & lesson tracking)
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    completed_lessons TEXT[] DEFAULT '{}',
    last_accessed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, course_id)
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'course_enrollments' AND policyname = 'Users can view own course progress'
    ) THEN
        CREATE POLICY "Users can view own course progress"
            ON public.course_enrollments FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'course_enrollments' AND policyname = 'Users can insert own course progress'
    ) THEN
        CREATE POLICY "Users can insert own course progress"
            ON public.course_enrollments FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'course_enrollments' AND policyname = 'Users can update own course progress'
    ) THEN
        CREATE POLICY "Users can update own course progress"
            ON public.course_enrollments FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'course_enrollments' AND policyname = 'Users can delete own course progress'
    ) THEN
        CREATE POLICY "Users can delete own course progress"
            ON public.course_enrollments FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;
