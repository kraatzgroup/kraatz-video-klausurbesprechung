-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    account_credits INTEGER DEFAULT 0,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create packages table
CREATE TABLE public.packages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    case_study_count INTEGER NOT NULL,
    price_cents INTEGER NOT NULL,
    stripe_price_id TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE NOT NULL,
    stripe_payment_intent_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    total_cents INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create case_study_requests table
CREATE TABLE public.case_study_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    case_study_number INTEGER,
    study_phase TEXT NOT NULL,
    legal_area TEXT NOT NULL,
    sub_area TEXT NOT NULL,
    focus_area TEXT NOT NULL,
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'materials_ready', 'submitted', 'under_review', 'corrected', 'completed')),
    pdf_url TEXT,
    case_study_material_url TEXT,
    additional_materials_url TEXT,
    submission_url TEXT,
    submission_downloaded_at TIMESTAMP WITH TIME ZONE,
    video_correction_url TEXT,
    written_correction_url TEXT,
    video_viewed_at TIMESTAMP WITH TIME ZONE,
    pdf_downloaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE public.submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_study_request_id UUID REFERENCES public.case_study_requests(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx')),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'corrected')),
    correction_video_url TEXT,
    landing_page_url TEXT,
    grade NUMERIC(4,2) CHECK (grade >= 0 AND grade <= 18),
    grade_text TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    corrected_at TIMESTAMP WITH TIME ZONE
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning')),
    read BOOLEAN DEFAULT false,
    related_case_study_id UUID REFERENCES public.case_study_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_study_requests_updated_at BEFORE UPDATE ON public.case_study_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_study_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see and edit their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Everyone can view active packages
CREATE POLICY "Anyone can view active packages" ON public.packages
    FOR SELECT USING (active = true);

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view and manage their own case study requests
CREATE POLICY "Users can view own case study requests" ON public.case_study_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own case study requests" ON public.case_study_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own case study requests" ON public.case_study_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can view and manage their own submissions
CREATE POLICY "Users can view own submissions" ON public.submissions
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM public.case_study_requests WHERE id = case_study_request_id)
    );

CREATE POLICY "Users can create own submissions" ON public.submissions
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM public.case_study_requests WHERE id = case_study_request_id)
    );

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin/Instructor policies
CREATE POLICY "Instructors can view all case study requests" ON public.case_study_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('instructor', 'admin')
        )
    );

CREATE POLICY "Instructors can update case study requests" ON public.case_study_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('instructor', 'admin')
        )
    );

CREATE POLICY "Instructors can view all submissions" ON public.submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('instructor', 'admin')
        )
    );

CREATE POLICY "Instructors can update submissions" ON public.submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('instructor', 'admin')
        )
    );

-- Insert sample packages
INSERT INTO public.packages (name, description, case_study_count, price_cents, stripe_price_id) VALUES
('Starter Package', 'Perfect for beginners - includes 5 custom case studies', 5, 4999, 'price_starter'),
('Professional Package', 'Most popular choice - includes 10 custom case studies', 10, 8999, 'price_professional'),
('Premium Package', 'For serious students - includes 20 custom case studies', 20, 15999, 'price_premium');

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', COALESCE(NEW.user_metadata->>'first_name', '')),
        COALESCE(NEW.raw_user_meta_data->>'last_name', COALESCE(NEW.user_metadata->>'last_name', ''))
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- User already exists, just return
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail the auth user creation
        RAISE WARNING 'Failed to create user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
