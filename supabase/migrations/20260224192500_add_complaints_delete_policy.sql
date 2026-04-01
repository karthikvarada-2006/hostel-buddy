-- Add DELETE policies for complaints table

-- Allow students to delete their own complaints
CREATE POLICY "Students can delete their own complaints" ON public.complaints
  FOR DELETE USING (student_id = public.get_profile_id(auth.uid()));

-- Allow admins to delete any complaint
CREATE POLICY "Admins can delete any complaint" ON public.complaints
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');
