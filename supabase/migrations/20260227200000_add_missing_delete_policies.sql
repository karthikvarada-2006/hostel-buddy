-- Add missing DELETE policies and fix foreign key constraints to allow student deletion

-- 1. Addition of missing DELETE policies

-- Allow students to delete their own passes (if pending)
CREATE POLICY "Students can delete their own pending passes" ON public.passes
  FOR DELETE USING (
    student_id = public.get_profile_id(auth.uid()) 
    AND status = 'pending'
  );

-- Allow admins to delete any pass
CREATE POLICY "Admins can delete any pass" ON public.passes
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');

-- Allow admins to delete any attendance record
CREATE POLICY "Admins can delete any attendance" ON public.attendance
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');


-- 2. Fixing Foreign Key constraints to use ON DELETE CASCADE or SET NULL
-- This ensures that deleting a student profile doesn't fail due to dependent records

-- Attendance: CASCADE delete when student is deleted
ALTER TABLE public.attendance 
  DROP CONSTRAINT IF EXISTS attendance_student_id_fkey,
  ADD CONSTRAINT attendance_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Complaints: CASCADE delete when student is deleted
ALTER TABLE public.complaints 
  DROP CONSTRAINT IF EXISTS complaints_student_id_fkey,
  ADD CONSTRAINT complaints_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Passes: CASCADE delete when student is deleted
ALTER TABLE public.passes 
  DROP CONSTRAINT IF EXISTS passes_student_id_fkey,
  ADD CONSTRAINT passes_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Notifications: CASCADE delete when user is deleted
ALTER TABLE public.notifications 
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Ensure all creator/marker fields are SET NULL on delete to preserve history without blocking deletion
-- (Some of these might already be set in previous migrations, but we ensure it here)

ALTER TABLE public.attendance 
  DROP CONSTRAINT IF EXISTS attendance_marked_by_fkey,
  ADD CONSTRAINT attendance_marked_by_fkey 
  FOREIGN KEY (marked_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.food_menu
  DROP CONSTRAINT IF EXISTS food_menu_created_by_fkey,
  ADD CONSTRAINT food_menu_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.notices
  DROP CONSTRAINT IF EXISTS notices_created_by_fkey,
  ADD CONSTRAINT notices_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.passes
  DROP CONSTRAINT IF EXISTS passes_approved_by_fkey,
  ADD CONSTRAINT passes_approved_by_fkey 
  FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
