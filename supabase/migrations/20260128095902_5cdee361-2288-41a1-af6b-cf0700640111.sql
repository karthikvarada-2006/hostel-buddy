-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'admin');

-- Create enum for complaint status
CREATE TYPE complaint_status AS ENUM ('pending', 'in_progress', 'resolved');

-- Create enum for complaint priority
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high');

-- Create enum for pass type
CREATE TYPE pass_type AS ENUM ('outing', 'home_vacation');

-- Create enum for pass status
CREATE TYPE pass_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  room_number TEXT,
  hostel_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create food menu table
CREATE TABLE public.food_menu (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_date DATE NOT NULL UNIQUE,
  breakfast TEXT,
  lunch TEXT,
  dinner TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  is_present BOOLEAN NOT NULL DEFAULT false,
  marked_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, attendance_date)
);

-- Create complaints table
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status complaint_status NOT NULL DEFAULT 'pending',
  priority complaint_priority DEFAULT 'medium',
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create passes table
CREATE TABLE public.passes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pass_type pass_type NOT NULL,
  reason TEXT NOT NULL,
  destination TEXT NOT NULL,
  from_date TIMESTAMP WITH TIME ZONE NOT NULL,
  to_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status pass_status NOT NULL DEFAULT 'pending',
  admin_comment TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notices table
CREATE TABLE public.notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_important BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Security definer function to get profile id
CREATE OR REPLACE FUNCTION public.get_profile_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- Food menu policies (everyone can view, only admins can modify)
CREATE POLICY "Everyone can view menu" ON public.food_menu
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert menu" ON public.food_menu
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update menu" ON public.food_menu
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete menu" ON public.food_menu
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');

-- Attendance policies
CREATE POLICY "Students can view their own attendance" ON public.attendance
  FOR SELECT USING (student_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can view all attendance" ON public.attendance
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert attendance" ON public.attendance
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update attendance" ON public.attendance
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- Complaints policies
CREATE POLICY "Students can view their own complaints" ON public.complaints
  FOR SELECT USING (student_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can view all complaints" ON public.complaints
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Students can insert their own complaints" ON public.complaints
  FOR INSERT WITH CHECK (student_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can update any complaint" ON public.complaints
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Students can update their own pending complaints" ON public.complaints
  FOR UPDATE USING (
    student_id = public.get_profile_id(auth.uid()) 
    AND status = 'pending'
  );

-- Passes policies
CREATE POLICY "Students can view their own passes" ON public.passes
  FOR SELECT USING (student_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can view all passes" ON public.passes
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Students can insert their own passes" ON public.passes
  FOR INSERT WITH CHECK (student_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can update any pass" ON public.passes
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- Notices policies
CREATE POLICY "Everyone can view non-archived notices" ON public.notices
  FOR SELECT USING (is_archived = false OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert notices" ON public.notices
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update notices" ON public.notices
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete notices" ON public.notices
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_food_menu_updated_at
  BEFORE UPDATE ON public.food_menu
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_passes_updated_at
  BEFORE UPDATE ON public.passes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notices_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Additional Complaints policies for deletion
CREATE POLICY "Students can delete their own complaints" ON public.complaints
  FOR DELETE USING (student_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can delete any complaint" ON public.complaints
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');