-- ============================================================================
-- BITC PRODUCTION REMEDIATION SCHEMA (MIGRATION 004)
-- Creates required tables, indexes, and RLS policies for Tier 1, 2, and 3 features.
-- ============================================================================

-- 1. Event Tickets & Attendance Roster
CREATE TABLE IF NOT EXISTS public.event_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ticket_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'checked_in', 'cancelled')),
    attendee_name TEXT,
    attendee_email TEXT,
    qr_payload TEXT,
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_event_tickets_code ON public.event_tickets (ticket_code);
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_id ON public.event_tickets (event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_user_id ON public.event_tickets (user_id);

ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
    ON public.event_tickets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tickets"
    ON public.event_tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view and update all tickets"
    ON public.event_tickets FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- 2. Job Applications & Candidate Review
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    applicant_name TEXT,
    applicant_role TEXT,
    applicant_avatar TEXT,
    cover_note TEXT NOT NULL,
    portfolio_links JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'viewed', 'shortlisted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications (job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON public.job_applications (user_id);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
    ON public.job_applications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can submit applications"
    ON public.job_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Job owners and admins can view applications"
    ON public.job_applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id::text = public.job_applications.job_id
            AND jobs.created_by = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Job owners and admins can update application status"
    ON public.job_applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id::text = public.job_applications.job_id
            AND jobs.created_by = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 3. Mentorship Bookings
CREATE TABLE IF NOT EXISTS public.mentorship_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id TEXT NOT NULL,
    mentee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentorship_mentor_id ON public.mentorship_bookings (mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_mentee_id ON public.mentorship_bookings (mentee_id);

ALTER TABLE public.mentorship_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their mentorship bookings"
    ON public.mentorship_bookings FOR SELECT
    USING (auth.uid() = mentee_id OR mentor_id = auth.uid()::text);

CREATE POLICY "Users can insert mentorship bookings"
    ON public.mentorship_bookings FOR INSERT
    WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Mentors and mentees can update bookings"
    ON public.mentorship_bookings FOR UPDATE
    USING (auth.uid() = mentee_id OR mentor_id = auth.uid()::text);

-- 4. Portfolio Projects & Case Studies
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    tags TEXT[] DEFAULT '{}',
    project_url TEXT,
    client_name TEXT,
    year TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_user ON public.portfolio_items (user_id);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portfolio items"
    ON public.portfolio_items FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their portfolio items"
    ON public.portfolio_items FOR ALL
    USING (auth.uid() = user_id);

-- 5. User Claimed Marketplace Products
CREATE TABLE IF NOT EXISTS public.user_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, product_id)
);

ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claimed products"
    ON public.user_products FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can claim products"
    ON public.user_products FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 6. Course Learning Enrollments & Progress
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

CREATE POLICY "Users can view and update own course progress"
    ON public.course_enrollments FOR ALL
    USING (auth.uid() = user_id);

-- 7. 1:1 Direct Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages (sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages sent to or by them"
    ON public.messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark messages as read"
    ON public.messages FOR UPDATE
    USING (auth.uid() = recipient_id);

-- 8. Payment Transactions Ledger
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'succeeded',
    creator_id TEXT,
    payer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    payer_email TEXT,
    platform_fee_cents INTEGER NOT NULL,
    creator_net_cents INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
    ON public.payment_transactions FOR SELECT
    USING (auth.uid() = payer_id OR creator_id = auth.uid()::text);

CREATE POLICY "Admins can view all transactions"
    ON public.payment_transactions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- 9. Creator Verification Requests
CREATE TABLE IF NOT EXISTS public.creator_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_url TEXT,
    case_studies_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.creator_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification request"
    ON public.creator_verifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can submit a verification request"
    ON public.creator_verifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can review verifications"
    ON public.creator_verifications FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- 10. Reported Content (Moderation)
CREATE TABLE IF NOT EXISTS public.reported_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'room', 'user')),
    target_id TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id),
    reporter_id UUID REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reported_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reported content"
    ON public.reported_content FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));
